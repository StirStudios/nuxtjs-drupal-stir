import type { WebformFieldProps, WebformState } from '~/types'
import {
  object,
  string,
  number,
  array,
  boolean,
  type ObjectSchema,
  type AnySchema,
  type NumberSchema,
} from 'yup'
import { evaluateCondition } from './evaluateUtils'

const SCHEMA_CACHE_LIMIT = 100
const schemaCache = new WeakMap<
  Record<string, WebformFieldProps>,
  Map<string, ObjectSchema<Record<string, unknown>>>
>()

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  )

  return `{${entries.map(([k, v]) => `${k}:${stableStringify(v)}`).join(',')}}`
}

function fieldSignature(field: WebformFieldProps): string {
  const signature = {
    type: field['#type'],
    required: field['#required'],
    requiredError: field['#requiredError'],
    min: field['#min'],
    max: field['#max'],
    minSelected: field['#minSelected'],
    maxSelected: field['#maxSelected'],
    multiple: field['#multiple'],
    options: field['#options'],
    optionProperties: field['#optionProperties'],
    composite: field['#composite'],
  }

  return stableStringify(signature)
}

function getVisibleEntries(
  fields: Record<string, WebformFieldProps>,
  state: WebformState,
): Array<[string, WebformFieldProps]> {
  const visible: Array<[string, WebformFieldProps]> = []

  for (const [key, field] of Object.entries(fields)) {
    if (evaluateCondition(field['#states']?.visible, state, true)) {
      visible.push([key, field])
    }
  }
  return visible
}

function getSchemaCacheKey(
  visibleEntries: Array<[string, WebformFieldProps]>,
): string {
  return visibleEntries
    .map(([key, field]) => `${key}:${fieldSignature(field)}`)
    .join('|')
}

export function buildYupSchema(
  fields: Record<string, WebformFieldProps>,
  state: WebformState,
): ObjectSchema<Record<string, unknown>> {
  const visibleEntries = getVisibleEntries(fields, state)
  const cacheKey = getSchemaCacheKey(visibleEntries)
  let perFieldsCache = schemaCache.get(fields)

  if (!perFieldsCache) {
    perFieldsCache = new Map()
    schemaCache.set(fields, perFieldsCache)
  }

  const cached = perFieldsCache.get(cacheKey)

  if (cached) return cached

  const shape: Record<string, AnySchema> = {}

  for (const [key, field] of visibleEntries) {
    const requiredError = field['#requiredError'] || 'This field is required'
    const isRequired = field['#required'] === true
    const isEmail = field['#type'] === 'email'
    const isNumber = field['#type'] === 'number' || field['#type'] === 'range'
    const isCheckboxes = field['#type'] === 'checkboxes'
    const isCheckbox = field['#type'] === 'checkbox'
    const isDateLike = field['#type'] === 'date' || field['#type'] === 'datetime'
    const isMultiple = '#multiple' in field && !!field['#multiple']
    const multipleCountRaw = Number(field['#multiple'])
    const requiredMultipleCount =
      isDateLike && Number.isFinite(multipleCountRaw) && multipleCountRaw > 1
        ? multipleCountRaw
        : 1

    if ('#composite' in field && typeof field['#composite'] === 'object') {
      const subShape: Record<string, AnySchema> = {}

      for (const [subKey, subField] of Object.entries(
        field['#composite'] as Record<string, WebformFieldProps>,
      )) {
        subShape[subKey] = string()
          .nullable()
          .when([], {
            is: () => field['#required'] || subField['#required'],
            then: (schema) => schema.required(requiredError),
          })
      }
      shape[key] = object().shape(subShape)
      continue
    }

    if (isCheckboxes || isMultiple) {
      let validator = array().of(string())

      if (isRequired) {
        validator = validator
          .min(requiredMultipleCount, requiredError)
          .required(requiredError)
      }
      if (field['#minSelected']) {
        validator = validator.min(
          field['#minSelected'],
          `Please select at least ${field['#minSelected']} items`,
        )
      }
      if (field['#maxSelected']) {
        validator = validator.max(
          field['#maxSelected'],
          `You can select up to ${field['#maxSelected']} items`,
        )
      }
      shape[key] = validator
      continue
    }

    if (isCheckbox) {
      let checkboxSchema = boolean()
        .transform((value) => value === '1' || value === true)
        .oneOf([true], requiredError)

      if (isRequired) {
        checkboxSchema = checkboxSchema.required(requiredError)
      }

      shape[key] = checkboxSchema
      continue
    }

    let base: AnySchema = string().nullable()

    if (isNumber) {
      let numSchema = number()
        .typeError('Must be a number')
        .nullable() as NumberSchema<number | undefined>

      if (field['#min'] !== undefined) {
        numSchema = numSchema.min(
          field['#min'],
          `Minimum value is ${field['#min']}`,
        )
      }
      if (field['#max'] !== undefined) {
        numSchema = numSchema.max(
          field['#max'],
          `Maximum value is ${field['#max']}`,
        )
      }
      base = numSchema
    } else if (isEmail) {
      base = string().nullable().email('Invalid email')
    } else if (field['#type'] === 'tel') {
      base = string()
        .nullable()
        .matches(/^\+?[0-9\s\-().]{7,20}$/, 'Invalid phone number')
    }

    shape[key] = base.when([], {
      is: () => isRequired,
      then: (schema) => schema.required(requiredError),
    })
  }

  const schema = object().shape(shape)

  if (perFieldsCache.size >= SCHEMA_CACHE_LIMIT) {
    const oldestKey = perFieldsCache.keys().next().value

    if (oldestKey) perFieldsCache.delete(oldestKey)
  }
  perFieldsCache.set(cacheKey, schema)

  return schema
}
