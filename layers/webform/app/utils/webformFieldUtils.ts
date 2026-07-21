import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import type {
  WebformActionProps,
  WebformDefinition,
  WebformFieldProps,
} from '#stir/types'

const PROPERTY_ALIASES: Record<string, string> = {
  '#default': '#defaultValue',
  '#default_value': '#defaultValue',
  '#floating_label': '#floatingLabel',
  '#group_max_selected': '#groupMaxSelected',
  '#input_type': '#inputType',
  '#is_taxable': '#isTaxable',
  '#max_selected': '#maxSelected',
  '#min_selected': '#minSelected',
  '#option_properties': '#optionProperties',
  '#per_guest': '#perGuest',
  '#required_error': '#requiredError',
  '#service_fee_applicable': '#serviceFeeApplicable',
  '#tab_group': '#tabGroup',
}

const BOOLEAN_PROPERTIES = [
  '#disabled',
  '#floatingLabel',
  '#isTaxable',
  '#modal',
  '#perGuest',
  '#readonly',
  '#relocated',
  '#required',
  '#serviceFeeApplicable',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toCamelCase(value: string): string {
  if (!value.includes('_')) return value

  return value.toLowerCase().replace(
    /_([a-z0-9])/g,
    (_, character: string) => character.toUpperCase(),
  )
}

function normalizeMetadataKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeMetadataKeys)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      toCamelCase(key),
      normalizeMetadataKeys(item),
    ]),
  )
}

function normalizeMetadataMap(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([machineName, item]) => [
      machineName,
      normalizeMetadataKeys(item),
    ]),
  )
}

function resolveWebformFieldType(field: WebformFieldProps): string {
  const rawType = String(field['#type'] ?? '').trim().toLowerCase()
  const inputType =
    field['#inputType'] ??
    field['#widget'] ??
    (field['#attributes'] as Record<string, unknown> | undefined)?.type
  const normalizedInputType = String(inputType ?? '').trim().toLowerCase()

  if (rawType.includes('range')) return 'range'
  if (rawType === 'number' && normalizedInputType === 'range') return 'range'

  return rawType
}

function resolveWebformMultiple(value: unknown): boolean {
  if (value === true || value === 'true' || value === '1') return true

  const cardinality = Number(value)

  return Number.isFinite(cardinality) && cardinality > 1
}

function normalizeWebformField(
  value: unknown,
  fallbackName: string,
): WebformFieldProps {
  const source =
    value && typeof value === 'object'
      ? { ...(value as Record<string, unknown>) }
      : {}

  for (const [legacyName, canonicalName] of Object.entries(PROPERTY_ALIASES)) {
    if (source[canonicalName] === undefined && source[legacyName] !== undefined) {
      source[canonicalName] = source[legacyName]
    }
    Reflect.deleteProperty(source, legacyName)
  }

  for (const property of BOOLEAN_PROPERTIES) {
    if (source[property] !== undefined) {
      source[property] = resolveBooleanProp(source[property])
    }
  }

  const rawMultiple = source['#multiple']
  const rawCardinality = source['#cardinality']
  const numericMultiple = Number(rawMultiple)
  const numericCardinality = Number(rawCardinality)
  const cardinality = Number.isFinite(numericCardinality) && numericCardinality > 0
    ? numericCardinality
    : Number.isFinite(numericMultiple) && numericMultiple > 1
      ? numericMultiple
      : 1

  if (rawMultiple !== undefined || rawCardinality !== undefined) {
    source['#multiple'] = cardinality > 1 || resolveWebformMultiple(rawMultiple)
    source['#cardinality'] = cardinality
  }

  for (const property of ['#optionProperties', '#rules']) {
    if (source[property] !== undefined) {
      source[property] = normalizeMetadataMap(source[property])
    }
  }

  source['#name'] = String(source['#name'] || fallbackName)
  source['#type'] = resolveWebformFieldType(source as WebformFieldProps)

  if (source['#type'] === 'checkbox') {
    source['#defaultValue'] = resolveBooleanProp(source['#defaultValue'])
  }

  if (source.children && typeof source.children === 'object') {
    source.children = normalizeWebformFields(source.children)
  }

  return source as unknown as WebformFieldProps
}

function normalizeWebformFields(value: unknown): Record<string, WebformFieldProps> {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([name, field]) => {
      if (!isRecord(field) || typeof field['#type'] !== 'string' || !field['#type'].trim()) {
        return []
      }

      const normalizedField = normalizeWebformField(field, name)
      const machineName = String(normalizedField['#name'] || name)

      return [[machineName, normalizedField]]
    }),
  )
}

function normalizeWebformAction(value: unknown): WebformActionProps {
  const action =
    value && typeof value === 'object'
      ? { ...(value as Record<string, unknown>) }
      : {}
  const submitLabel =
    action['#submitLabel'] ??
    action['#submit__label'] ??
    action['#submit_label'] ??
    action['#submit_Label']

  if (submitLabel !== undefined) action['#submitLabel'] = String(submitLabel)
  delete action['#submit__label']
  delete action['#submit_label']
  delete action['#submit_Label']

  return action as WebformActionProps
}

function normalizeWebformActions(value: unknown): WebformActionProps[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((action) => {
    if (!isRecord(action) || typeof action['#type'] !== 'string' || !action['#type'].trim()) {
      return []
    }

    return [normalizeWebformAction(action)]
  })
}

/**
 * Validates and adapts legacy payloads once at the Drupal/Nuxt boundary.
 */
export function normalizeWebformDefinition(value: unknown): WebformDefinition {
  const source =
    isRecord(value)
      ? value
      : {}
  const schemaVersion = source.schemaVersion

  if (schemaVersion !== undefined && schemaVersion !== 1) {
    throw new TypeError(`Unsupported webform schema version: ${String(schemaVersion)}`)
  }

  return {
    schemaVersion: 1,
    webformId: String(source.webformId || ''),
    webformTitle: String(source.webformTitle || ''),
    fields: normalizeWebformFields(source.fields),
    actions: normalizeWebformActions(source.actions),
    webformConfirmation: String(source.webformConfirmation || ''),
    webformConfirmationType: String(source.webformConfirmationType || ''),
    webformRedirect:
      typeof source.webformRedirect === 'string' ? source.webformRedirect : null,
    webformSubmissions:
      typeof source.webformSubmissions === 'string'
        ? source.webformSubmissions
        : null,
  }
}
