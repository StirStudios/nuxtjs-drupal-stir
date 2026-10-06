import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import type {
  WebformActionProps,
  WebformConditionGroup,
  WebformConditionRule,
  WebformDefinition,
  WebformFieldProps,
  WebformStateCondition,
} from '#stir/types'
import { isConditionGroup } from './webformConditions'

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

// Webform element types that share another type's component and value
// shape. Webform stores a value for each exactly as for its family.
const TYPE_ALIASES: Record<string, string> = {
  radios: 'radio',
  webform_radios_other: 'radio',
  webform_buttons: 'radio',
  webform_buttons_other: 'radio',
  webform_rating: 'radio',
  webform_scale: 'radio',
  webform_select_other: 'select',
  webform_checkboxes_other: 'checkboxes',
  webform_toggles: 'checkboxes',
  webform_toggle: 'checkbox',
  webform_terms_of_service: 'checkbox',
  webform_email_confirm: 'email',
  webform_email_multiple: 'textfield',
  webform_autocomplete: 'textfield',
  search: 'textfield',
  text: 'textfield',
  webform_time: 'time',
  webform_address: 'address',
}

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

function toDrupalMachineName(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
}

function comparableMachineName(value: string): string {
  return value.replace(/[_-]/g, '').toLowerCase()
}

function resolveDrupalMachineName(
  transportedName: string,
  canonicalNames: string[],
): string {
  const comparable = comparableMachineName(transportedName)

  return canonicalNames.find(
    candidate => comparableMachineName(candidate) === comparable,
  ) || toDrupalMachineName(transportedName)
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

function normalizeMetadataMap(
  value: unknown,
  canonicalMachineNames: string[] = [],
): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([machineName, item]) => [
      canonicalMachineNames.length
        ? resolveDrupalMachineName(machineName, canonicalMachineNames)
        : machineName,
      normalizeMetadataKeys(item),
    ]),
  )
}

function normalizeOptionMap(
  value: unknown,
  canonicalMachineNames: string[],
): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([machineName, label]) => [
      resolveDrupalMachineName(machineName, canonicalMachineNames),
      label,
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

  return TYPE_ALIASES[rawType] ?? rawType
}

/**
 * Lists a rating or scale's numbers as the options Webform stores.
 */
function scaleOptions(source: Record<string, unknown>): Record<string, string> {
  const fallbackMax = 5
  const min = Math.max(1, Number(source['#min'] ?? 1) || 1)
  const max = Number(source['#max'] ?? fallbackMax) || fallbackMax
  const options: Record<string, string> = {}

  for (let value = min; value <= max && value - min < 100; value += 1) {
    options[String(value)] = String(value)
  }

  return options
}

/**
 * Restores a composite's parts, keyed by the names Drupal stores.
 *
 * Producers before contract 1.32 sent only an address's parts, with
 * `label`, `options` and no `#type`; a part without `#name` predates 1.31,
 * and its camel-cased key is converted back.
 */
function normalizeCompositeParts(
  composite: Record<string, unknown>,
): Record<string, WebformFieldProps> {
  return Object.fromEntries(
    Object.entries(composite).flatMap(([key, value]) => {
      if (!isRecord(value)) return []

      const part = { ...value }

      if (part['#options'] === undefined && isRecord(part.options)) {
        part['#options'] = part.options
      }
      part['#type'] ??= part['#options'] === undefined ? 'textfield' : 'select'
      part['#title'] ??= part.label
      part['#name'] = typeof part['#name'] === 'string' && part['#name']
        ? part['#name']
        : toDrupalMachineName(key)

      const normalized = normalizeWebformField(part, key)

      return [[normalized['#name'], normalized]]
    }),
  )
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

  const keyList = (property: string): string[] =>
    Array.isArray(source[property])
      ? (source[property] as unknown[]).filter(
          (value): value is string => typeof value === 'string',
        )
      : []
  const optionKeys = keyList('#optionKeys')

  if (source['#options'] !== undefined) {
    source['#options'] = normalizeOptionMap(source['#options'], optionKeys)
  }
  if (source['#questions'] !== undefined) {
    source['#questions'] = normalizeOptionMap(source['#questions'], keyList('#questionKeys'))
  }
  if (source['#answers'] !== undefined) {
    source['#answers'] = normalizeOptionMap(source['#answers'], keyList('#answerKeys'))
  }
  if (source['#optionProperties'] !== undefined) {
    source['#optionProperties'] = normalizeMetadataMap(
      source['#optionProperties'],
      optionKeys,
    )
  }
  if (source['#rules'] !== undefined) {
    source['#rules'] = normalizeMetadataMap(source['#rules'])
  }

  source['#name'] = String(source['#name'] || fallbackName)
  const rawType = String(source['#type'] ?? '').trim().toLowerCase()

  source['#type'] = resolveWebformFieldType(source as WebformFieldProps)

  if ((rawType === 'webform_rating' || rawType === 'webform_scale') && source['#options'] === undefined) {
    source['#options'] = scaleOptions(source)
  }
  // Webform links the braced words of its terms to the terms themselves.
  if (rawType === 'webform_terms_of_service' && typeof source['#title'] === 'string') {
    source['#title'] = source['#title'].replace(/[{}]/g, '')
  }

  // Custom Elements camel-cases composite part keys too (an address's
  // `state_province` arrives as `stateProvince`); each part's `#name` is the
  // key Drupal stores it under.
  if (isRecord(source['#composite'])) {
    source['#composite'] = normalizeCompositeParts(source['#composite'])
  }

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

type ConditionTargets = Map<string, string[]>

/**
 * Indexes every element name, with the names of its parts or options, so a
 * camel-cased legacy selector can be matched back to Drupal's name.
 */
function collectConditionTargets(
  fields: Record<string, WebformFieldProps>,
  targets: ConditionTargets = new Map(),
): ConditionTargets {
  for (const field of Object.values(fields)) {
    const composite = isRecord(field['#composite']) ? Object.keys(field['#composite']) : []
    const options = isRecord(field['#options']) ? Object.keys(field['#options']) : []

    targets.set(field['#name'], [...composite, ...options])
    if (isRecord(field.children)) {
      collectConditionTargets(field.children as Record<string, WebformFieldProps>, targets)
    }
  }

  return targets
}

function resolveSelectorName(selector: string, targets: ConditionTargets): string | null {
  const match = selector.match(/:input\[name="([^"]+)"\]/)

  if (!match?.[1]) return null

  const parts = match[1].replace(/\]\[|\[/g, '|').replace(/\]/g, '').split('|')

  if (parts[0] === 'files' && parts.length > 1) parts.shift()

  const [head = '', ...rest] = parts
  const name = resolveDrupalMachineName(head, [...targets.keys()])
  const children = targets.get(name) ?? []

  return [name, ...rest.map(part => resolveDrupalMachineName(part, children))].join('.')
}

function legacyConditionGroup(
  conditions: unknown,
  targets: ConditionTargets,
): WebformConditionGroup {
  if (Array.isArray(conditions)) {
    return {
      logic: conditions.includes('xor') ? 'xor' : 'or',
      rules: conditions.filter(isRecord).map(item => legacyConditionGroup(item, targets)),
    }
  }

  const rules: WebformConditionRule[] = Object.entries(isRecord(conditions) ? conditions : {})
    .map(([selector, condition]) => ({
      name: resolveSelectorName(selector, targets),
      selector,
      triggers: (Array.isArray(condition) ? condition : [condition])
        .filter(isRecord)
        .flatMap((trigger) => {
          const [name, value] = Object.entries(trigger)[0] ?? []

          if (!name) return []
          // Older producers sent an empty value as 'any', meaning filled.
          if (name === 'value' && value === 'any') return [{ trigger: 'filled', value: true }]
          if (name === 'value' && isRecord(value)) {
            const [comparison, operand] = Object.entries(value)[0] ?? []

            if (comparison) return [{ trigger: toDrupalMachineName(comparison), value: operand }]
          }

          return [{ trigger: name, value }]
        }),
    }))

  return { logic: 'and', rules }
}

/**
 * Builds `#conditions` from `#states` for producers before contract 1.32,
 * whose selector keys Custom Elements camel-cased.
 */
function legacyConditions(
  states: unknown,
  targets: ConditionTargets,
): WebformStateCondition[] {
  if (!isRecord(states)) return []

  return Object.entries(states).flatMap(([state, conditions]) => {
    if (!conditions || typeof conditions !== 'object') return []

    return [{
      // `visible-slide` arrives as `visibleSlide`.
      state: toDrupalMachineName(state).replace(/[-_]slide$/, ''),
      ...legacyConditionGroup(conditions, targets),
    }]
  })
}

function warnUnknownTargets(
  formId: string,
  group: WebformConditionGroup,
  targets: ConditionTargets,
): void {
  for (const rule of group.rules) {
    if (isConditionGroup(rule)) {
      warnUnknownTargets(formId, rule, targets)
    } else if (!rule.name || !targets.has(rule.name.split('.')[0] ?? '')) {
      console.warn(`[stir-webform] ${formId}: the condition ${rule.selector} names no field in this form, so Drupal ignores it too.`)
    }
  }
}

/**
 * Gives every field `#conditions`, and warns about any that name no field.
 */
function attachConditions(
  formId: string,
  fields: Record<string, WebformFieldProps>,
  targets: ConditionTargets,
): void {
  for (const field of Object.values(fields)) {
    if (!Array.isArray(field['#conditions'])) {
      field['#conditions'] = legacyConditions(field['#states'], targets)
    }
    for (const group of field['#conditions']) {
      warnUnknownTargets(formId, group, targets)
    }
    if (isRecord(field.children)) {
      attachConditions(formId, field.children as Record<string, WebformFieldProps>, targets)
    }
  }
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

  const webformId = String(source.webformId || '')
  const fields = normalizeWebformFields(source.fields)

  attachConditions(webformId, fields, collectConditionTargets(fields))

  return {
    schemaVersion: 1,
    webformId,
    webformTitle: String(source.webformTitle || ''),
    fields,
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
