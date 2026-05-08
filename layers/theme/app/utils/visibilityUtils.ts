import type { ConditionEntry, WebformState } from '~/types'

export const isVisibleForTab = (
  visibility: ConditionEntry[] | ConditionEntry | undefined,
  tabValue: string,
): boolean => {
  if (!visibility) return true

  const conditions = Array.isArray(visibility) ? visibility : [visibility]

  return conditions.some((condition) => {
    if (typeof condition === 'object') {
      const tabCondition = condition[':input[name="tabs"]']

      return tabCondition?.value === tabValue
    }
    return false
  })
}

export const handleTabChange = (
  visibility: ConditionEntry[] | ConditionEntry | undefined,
  tabValue: string,
  state: WebformState,
  fieldName: string,
) => {
  if (!visibility) return
  if (!isVisibleForTab(visibility, tabValue)) {
    state[fieldName] = []
  }
}
