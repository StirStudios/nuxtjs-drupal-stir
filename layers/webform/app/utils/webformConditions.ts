import type {
  WebformConditionGroup,
  WebformConditionRule,
  WebformFieldProps,
  WebformState,
} from '#stir/types'

/**
 * Evaluates Webform `#conditions` as Drupal does when it validates a
 * submission, so a field is shown, hidden and required by the same rules
 * that will judge it.
 *
 * @see \Drupal\webform\WebformSubmissionConditionsValidator
 */

// Each alias names the negation of a canonical state or trigger.
const ALIASES: Record<string, string> = {
  enabled: '!disabled',
  invisible: '!visible',
  invalid: '!valid',
  optional: '!required',
  filled: '!empty',
  unchecked: '!checked',
  expanded: '!collapsed',
  open: '!collapsed',
  closed: 'collapsed',
  readwrite: '!readonly',
}

export interface WebformFieldStates {
  visible: boolean
  required: boolean
  disabled: boolean
  readonly: boolean
  /** Undefined when no condition sets the checked state. */
  checked: boolean | undefined
}

function resolveAlias(name: string): { name: string, negate: boolean } {
  const resolved = ALIASES[name] ?? name

  return resolved.startsWith('!')
    ? { name: resolved.slice(1), negate: true }
    : { name: resolved, negate: false }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isConditionGroup(
  rule: WebformConditionRule | WebformConditionGroup,
): rule is WebformConditionGroup {
  return Array.isArray((rule as WebformConditionGroup).rules)
}

/**
 * Reads the value a rule targets, as Drupal would see it.
 *
 * `extras.early_bird` on a checkboxes value is that option, or '' when it is
 * not selected; `address.city` is a composite part. A checkbox is 1 or 0.
 */
export function getConditionValue(
  state: WebformState,
  name: string,
): unknown {
  const [head = '', ...path] = name.split('.')
  let current: unknown = state[head]

  for (const part of path) {
    if (Array.isArray(current)) {
      return current.map(String).includes(part) ? part : ''
    }
    if (!isRecord(current)) return undefined
    current = current[part]
  }

  if (typeof current === 'boolean') return current ? 1 : 0

  return current
}

// PHP's empty(), except that Webform treats '0' as filled.
function isEmptyValue(value: unknown): boolean {
  return value === undefined
    || value === null
    || value === ''
    || value === 0
    || value === false
    || (Array.isArray(value) && value.length === 0)
    || (isRecord(value) && Object.keys(value).length === 0)
}

function toPhpBoolean(value: unknown): boolean {
  return value !== '0' && !isEmptyValue(value)
}

function toPhpString(value: unknown): string {
  if (value === undefined || value === null || value === false) return ''
  if (value === true) return '1'

  return String(value)
}

function toFloat(value: unknown): number {
  const parsed = Number.parseFloat(toPhpString(value))

  return Number.isFinite(parsed) ? parsed : 0
}

function checkTrigger(
  trigger: string,
  triggerValue: unknown,
  value: unknown,
): boolean | null {
  switch (trigger) {
    case 'empty':
      return isEmptyValue(value) === toPhpBoolean(triggerValue)
    case 'checked':
      return toPhpBoolean(value) === toPhpBoolean(triggerValue)
    case 'value':
      return toPhpString(value) === toPhpString(triggerValue)
    case 'pattern':
      try {
        return new RegExp(toPhpString(triggerValue), 'u').test(toPhpString(value))
      } catch {
        return null
      }
    case 'less':
      return value !== '' && toFloat(triggerValue) > toFloat(value)
    case 'less_equal':
      return value !== '' && toFloat(triggerValue) >= toFloat(value)
    case 'greater':
      return value !== '' && toFloat(triggerValue) < toFloat(value)
    case 'greater_equal':
      return value !== '' && toFloat(triggerValue) <= toFloat(value)
    case 'between': {
      if (value === '' || value === undefined || value === null) return null

      const [greater = '', less = ''] = toPhpString(triggerValue).split(':')
      const numeric = toFloat(value)

      return (greater === '' || numeric >= toFloat(greater))
        && (less === '' || numeric <= toFloat(less))
    }
    default:
      return null
  }
}

function checkCondition(
  rawTrigger: string,
  triggerValue: unknown,
  value: unknown,
): boolean {
  const { name: trigger, negate } = resolveAlias(rawTrigger)
  let result: boolean | null

  // A value with several items passes when any item does.
  if (Array.isArray(value) && trigger !== 'empty') {
    result = false
    for (const item of value) {
      const itemResult = checkTrigger(trigger, triggerValue, item)

      if (itemResult !== false) result = itemResult
    }
  } else {
    result = checkTrigger(trigger, triggerValue, value)
  }

  if (result === null) return false

  return negate ? !result : result
}

/**
 * Whether a condition group holds, or null when it names an element the form
 * does not have, in which case Drupal ignores the state too.
 */
export function evaluateConditionGroup(
  group: WebformConditionGroup,
  state: WebformState,
): boolean | null {
  const results: boolean[] = []

  for (const rule of group.rules) {
    if (isConditionGroup(rule)) {
      const result = evaluateConditionGroup(rule, state)

      if (result === null) return null
      results.push(result)
      continue
    }

    const head = rule.name?.split('.')[0]

    if (!rule.name || !head || !(head in state)) return null

    const value = getConditionValue(state, rule.name)

    results.push(rule.triggers.some(({ trigger, value: triggerValue }) =>
      checkCondition(trigger, triggerValue, value),
    ))
  }

  const passed = results.filter(Boolean).length

  if (group.logic === 'xor') return passed === 1
  if (group.logic === 'or') return passed > 0

  return passed === results.length
}

/**
 * Resolves the states a field's conditions set for the current values.
 *
 * Every condition must hold: a field inside a hidden container carries the
 * container's visibility too. Without a condition for a state, the field's
 * own property applies.
 */
export function resolveWebformFieldStates(
  field: WebformFieldProps,
  state: WebformState,
): WebformFieldStates {
  const results: Record<string, boolean[]> = {}

  for (const condition of field['#conditions'] ?? []) {
    const result = evaluateConditionGroup(condition, state)

    if (result === null) continue

    const { name, negate } = resolveAlias(condition.state)

    ;(results[name] ??= []).push(negate ? !result : result)
  }

  const holds = (name: string, fallback: boolean): boolean =>
    results[name] ? results[name].every(Boolean) : fallback

  return {
    visible: holds('visible', true),
    required: holds('required', field['#required'] === true),
    disabled: holds('disabled', field['#disabled'] === true),
    readonly: holds('readonly', field['#readonly'] === true),
    checked: results.checked ? results.checked.every(Boolean) : undefined,
  }
}

/**
 * The field as its conditions currently leave it, for components and
 * validation that read `#required` and `#disabled`.
 */
export function applyWebformFieldStates(
  field: WebformFieldProps,
  states: WebformFieldStates,
): WebformFieldProps {
  if (!field['#conditions']?.length) return field

  return {
    ...field,
    '#required': states.required,
    '#disabled': states.disabled,
    '#readonly': states.readonly,
  }
}
