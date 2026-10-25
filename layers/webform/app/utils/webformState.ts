import type { WebformFieldProps, WebformState } from '#stir/types'
import { isWebformDisplayElement } from './webformDisplayUtils'
import { isCompositeField, isSupportedWebformField } from './webformFieldTypes'
import { isWebformFileField } from './webformFileUtils'

/**
 * A field's starting value, in the shape Webform stores for it.
 */
export function getWebformFieldDefaultValue(
  field: WebformFieldProps,
): WebformState[string] {
  const defaultValue = field['#defaultValue']

  if (defaultValue !== undefined && defaultValue !== null) {
    if (Array.isArray(defaultValue)) return [...defaultValue]
    if (typeof defaultValue === 'object') {
      return { ...(defaultValue as Record<string, unknown>) }
    }
    if (
      typeof defaultValue === 'string' ||
      typeof defaultValue === 'number' ||
      typeof defaultValue === 'boolean'
    ) {
      return defaultValue
    }
    return ''
  }

  const type = field['#type']
  const multiple = field['#multiple'] === true

  if (isWebformFileField(field)) return multiple ? [] : undefined
  if (type === 'checkboxes' || multiple) return []
  if (type === 'checkbox') return false
  if (type === 'range') {
    const minValue = Number(field['#min'])

    return Number.isFinite(minValue) ? Math.max(1, minValue) : 1
  }

  return ''
}

/**
 * The form's values, keyed by the Drupal names they are submitted under.
 *
 * Nothing is kept for display elements, or for a field the layer cannot
 * show; Drupal alone judges those.
 */
export function createWebformState(
  fields: Record<string, WebformFieldProps>,
): WebformState {
  const state: WebformState = {}

  for (const [key, field] of Object.entries(fields)) {
    if (isWebformDisplayElement(field) || !isSupportedWebformField(field)) {
      continue
    }

    if (isCompositeField(field)) {
      const row = Object.fromEntries(
        Object.entries(field['#composite'] ?? {}).map(([part, partField]) => [
          part,
          getWebformFieldDefaultValue(partField),
        ]),
      )

      // Webform stores a composite that takes several values as a list.
      state[key] = (field['#multiple'] === true ? [row] : row) as WebformState[string]
    } else if (field['#type'] === 'webform_likert') {
      state[key] = {}
    } else {
      state[key] = getWebformFieldDefaultValue(field)
    }
  }

  return state
}

/**
 * Fills fields that allow it from the page URL, as Webform's "Allow the
 * element to be populated using query string parameters" does: `?space=12`
 * sets the `space` field. A field with options takes only one of them.
 */
export function applyWebformPrepopulate(
  state: WebformState,
  fields: Record<string, WebformFieldProps>,
  query: Record<string, unknown>,
): void {
  for (const [key, field] of Object.entries(fields)) {
    const raw = query[key]
    const value = Array.isArray(raw) ? raw.filter((item) => typeof item === 'string') : raw

    if (field['#prepopulate'] !== true || !(key in state) || (typeof value !== 'string' && !Array.isArray(value))) continue

    const values = Array.isArray(value) ? value : [value]
    const options = field['#options'] && typeof field['#options'] === 'object' ? Object.keys(field['#options']) : null
    const allowed = options ? values.filter((item) => options.includes(item)) : values

    if (!allowed.length) continue
    state[key] = Array.isArray(state[key]) ? allowed : allowed[0]!
  }
}
