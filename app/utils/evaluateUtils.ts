import type { ConditionType, ConditionEntry, WebformState } from '~/types'
import { getNestedStateValue, matchesCondition } from './stateUtils'
import { extractFieldName } from './stringUtils'

export const evaluateCondition = (
  condition: ConditionType | undefined,
  state: WebformState,
  defaultValue: boolean,
): boolean => {
  if (!condition || (Array.isArray(condition) && condition.length === 0)) {
    return defaultValue
  }

  if (Array.isArray(condition)) {
    let shouldBeVisible = false

    for (const entry of condition) {
      if (entry === 'or') {
        if (shouldBeVisible) return true
        shouldBeVisible = false
        continue
      }

      const typedEntry = entry as ConditionEntry

      const [selector, valueCondition] = Object.entries(typedEntry)[0] ?? []

      if (!selector) continue
      const targetFieldName = extractFieldName(selector)

      if (!targetFieldName) continue
      if (typeof valueCondition !== 'object') continue

      const currentValue = getNestedStateValue(state, targetFieldName)

      shouldBeVisible = matchesCondition(currentValue, valueCondition)
    }
    return shouldBeVisible
  }

  for (const [selector, valueCondition] of Object.entries(condition)) {
    const targetFieldName = extractFieldName(selector)

    if (!targetFieldName) continue
    if (typeof valueCondition !== 'object') continue

    const currentValue = getNestedStateValue(state, targetFieldName)

    if (!matchesCondition(currentValue, valueCondition)) {
      return false
    }
  }
  return true
}
