import type { WebformFieldProps, WebformState } from '#stir/types'
import {
  array,
  custom,
  object,
  type GenericSchema,
} from 'valibot'
import {
  applyWebformFieldStates,
  resolveWebformFieldStates,
} from './webformConditions'
import { isWebformDisplayElement } from './webformDisplayUtils'
import { isSupportedWebformField } from './webformFieldTypes'
import {
  allowsMultipleFiles,
  getFileExtensions,
  getFileMaxSize,
  isFileValue,
  isWebformFileField,
} from './webformFileUtils'

export type WebformValidationSchema = GenericSchema<Record<string, unknown>>

const SCHEMA_CACHE_LIMIT = 100
const schemaCache = new WeakMap<
  Record<string, WebformFieldProps>,
  Map<string, WebformValidationSchema>
>()

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  )

  return `{${entries.map(([key, entry]) => `${key}:${stableStringify(entry)}`).join(',')}}`
}

function fieldSignature(field: WebformFieldProps): string {
  return stableStringify({
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
  })
}

/**
 * The fields to validate, as their conditions currently leave them: shown,
 * and required or not.
 */
function getVisibleEntries(
  fields: Record<string, WebformFieldProps>,
  state: WebformState,
): Array<[string, WebformFieldProps]> {
  return Object.entries(fields).flatMap(([key, field]) => {
    if (isWebformDisplayElement(field) || !isSupportedWebformField(field)) return []

    const states = resolveWebformFieldStates(field, state)

    return states.visible ? [[key, applyWebformFieldStates(field, states)]] : []
  })
}

function getSchemaCacheKey(
  visibleEntries: Array<[string, WebformFieldProps]>,
): string {
  return visibleEntries
    .map(([key, field]) => `${key}:${fieldSignature(field)}`)
    .join('|')
}

export function buildValidationSchema(
  fields: Record<string, WebformFieldProps>,
  state: WebformState,
): WebformValidationSchema {
  const visibleEntries = getVisibleEntries(fields, state)
  const cacheKey = getSchemaCacheKey(visibleEntries)
  let perFieldsCache = schemaCache.get(fields)

  if (!perFieldsCache) {
    perFieldsCache = new Map()
    schemaCache.set(fields, perFieldsCache)
  }

  const cached = perFieldsCache.get(cacheKey)

  if (cached) return cached

  const entries: Record<string, GenericSchema> = {}

  for (const [key, field] of visibleEntries) {
    entries[key] = createFieldSchema(field)
  }

  const schema = object(entries) as WebformValidationSchema

  if (perFieldsCache.size >= SCHEMA_CACHE_LIMIT) {
    const oldestKey = perFieldsCache.keys().next().value

    if (oldestKey) perFieldsCache.delete(oldestKey)
  }
  perFieldsCache.set(cacheKey, schema)

  return schema
}

function createFieldSchema(field: WebformFieldProps): GenericSchema {
  const composite = field['#composite']

  if (composite && typeof composite === 'object') {
    // Webform enforces only each part's own #required; the composite's
    // #required just marks it.
    const entries: Record<string, GenericSchema> = {}

    for (const [key, part] of Object.entries(
      composite as Record<string, WebformFieldProps>,
    )) {
      entries[key] = valueSchema(value => fieldValidationMessage(part, value))
    }
    const row = object(entries)

    return field['#multiple'] === true ? array(row) : row
  }

  if (field['#type'] === 'webform_likert') {
    const questions = Object.keys(field['#questions'] ?? {})
    const requiredError = field['#requiredError'] || 'Please answer every question'

    return valueSchema((value) => {
      const answers = value && typeof value === 'object' ? value as Record<string, unknown> : {}

      return field['#required'] === true && questions.some(question => isEmpty(answers[question]))
        ? requiredError
        : null
    })
  }

  return valueSchema(value => fieldValidationMessage(field, value))
}

function valueSchema(
  getMessage: (value: unknown) => string | null,
): GenericSchema {
  return custom(
    value => getMessage(value) === null,
    issue => getMessage(issue.input) || 'Invalid value',
  )
}

function fieldValidationMessage(
  field: WebformFieldProps,
  value: unknown,
): string | null {
  const requiredError = field['#requiredError'] || 'This field is required'
  const required = field['#required'] === true
  const type = field['#type']
  const multiple = field['#multiple'] === true

  if (isWebformFileField(field)) {
    const values = allowsMultipleFiles(field)
      ? Array.isArray(value) ? value : []
      : isFileValue(value) ? [value] : []

    if (required && values.length === 0) return requiredError

    const maxSize = getFileMaxSize(field)
    const extensions = getFileExtensions(field)

    for (const file of values) {
      if (!isFileValue(file)) return 'Invalid file'
      if (maxSize && file.size > maxSize) return 'File is too large'

      const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

      if (extensions.length > 0 && !extensions.includes(extension)) {
        return 'File type is not allowed'
      }
    }
    return null
  }

  if (type === 'checkboxes' || multiple) {
    const values = Array.isArray(value) ? value.filter(item => !isEmpty(item)) : []
    // As Webform validates a multiple element: required means at least one
    // value, and #multiple caps how many. Its multiple__min_items only sets how
    // many empty rows its own form shows.
    const maxValues = multiple ? Number(field['#cardinality'] ?? 1) : Number.NaN

    if (required && values.length === 0) return requiredError
    if (Number.isFinite(maxValues) && maxValues > 1 && values.length > maxValues) {
      return `You can enter up to ${maxValues}`
    }
    if (field['#minSelected'] && values.length < field['#minSelected']) {
      return `Please select at least ${field['#minSelected']} items`
    }
    if (field['#maxSelected'] && values.length > field['#maxSelected']) {
      return `You can select up to ${field['#maxSelected']} items`
    }
    return null
  }

  if (type === 'checkbox') {
    const checked = value === true || value === '1'

    return required && !checked ? requiredError : null
  }

  if (required && isEmpty(value)) return requiredError
  if (isEmpty(value)) return null

  if (type === 'number' || type === 'range') {
    const numeric = typeof value === 'number' ? value : Number(value)

    if (!Number.isFinite(numeric)) return 'Must be a number'

    // Only the bounds Drupal enforces; a minimum belongs in the element's #min.
    const bound = (raw: unknown): number | undefined => {
      const parsed = raw === undefined || raw === null || raw === '' ? Number.NaN : Number(raw)

      return Number.isFinite(parsed) ? parsed : undefined
    }
    const min = bound(field['#min'])
    const max = bound(field['#max'])

    if (min !== undefined && numeric < min) return `Minimum value is ${min}`
    if (max !== undefined && numeric > Math.max(min ?? max, max)) {
      return `Maximum value is ${Math.max(min ?? max, max)}`
    }
  }

  if (type === 'email'
    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return 'Invalid email'
  }

  if (type === 'tel'
    && !/^\+?[0-9\s\-().]{7,20}$/.test(String(value))) {
    return 'Invalid phone number'
  }

  return null
}

function isEmpty(value: unknown): boolean {
  return value === undefined
    || value === null
    || value === ''
    || (Array.isArray(value) && value.length === 0)
}
