import type { WebformState } from '~/types'
import { normalizeValue } from './stringUtils'

export const getNestedStateValue = (
  state: WebformState,
  path: string,
): unknown | false => {
  const parts = path.split('.')
  let current: unknown = state

  for (const part of parts) {
    if (Array.isArray(current)) {
      if (current.includes(part)) {
        return part
      } else {
        return false
      }
    } else if (typeof current === 'object' && current !== null) {
      if (!(part in current)) {
        return false
      }
      current = (current as Record<string, unknown>)[part]
    } else {
      return false
    }
  }
  return current
}

export const matchesCondition = (
  currentValue: unknown,
  valueCondition: { value: string },
): boolean => {
  if (valueCondition.value === 'any') return !!currentValue

  if (Array.isArray(currentValue)) {
    return currentValue
      .map(String)
      .map(normalizeValue)
      .includes(normalizeValue(valueCondition.value))
  }

  if (typeof currentValue === 'string') {
    return normalizeValue(currentValue) === normalizeValue(valueCondition.value)
  }

  if (typeof currentValue === 'number') {
    return String(currentValue) === valueCondition.value
  }

  return false
}
