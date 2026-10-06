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
