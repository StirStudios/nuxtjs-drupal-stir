import { hasFileValue, isFileValue } from './webformFileUtils'

type OptionObject = { label: string; description?: string }
type OptionValue = string | OptionObject

function isOptionObject(value: OptionValue): value is OptionObject {
  return typeof value === 'object' && value !== null && 'label' in value
}

export function transformOptions(
  optionMap: Record<string, OptionValue>,
) {
  return Object.entries(optionMap).map(([value, option]) => {
    return {
      value,
      label: isOptionObject(option) ? option.label : option,
      description: isOptionObject(option) ? (option.description ?? '') : '',
    }
  })
}

/**
 * Serializes form state without changing Drupal-defined field or option keys.
 */
export function serializeWebformSubmission<T extends Record<string, unknown>>(
  payload: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      result[key] = value
      return
    }

    if (isFileValue(value) || (Array.isArray(value) && hasFileValue(value))) {
      result[key] = value
      return
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = serializeWebformSubmission(
        value as Record<string, unknown>,
      )
      return
    }

    if (Array.isArray(value)) {
      result[key] = value.filter(
        item => item !== '' && item !== null && item !== undefined,
      )
      return
    }

    if (typeof value === 'boolean') {
      result[key] = value ? '1' : '0'
      return
    }

    result[key] = value
  })

  return result
}
