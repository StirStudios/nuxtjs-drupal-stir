import type { WebformFieldProps, WebformState } from '~/types'

export const enforceMaxSelected = (
  val: string[],
  max: number = Infinity,
): string[] => {
  if (val.length > max) {
    return val.slice(val.length - max)
  }
  return val
}

export const enforceGroupLimit = (
  val: string[],
  fieldName: string,
  group: string | undefined,
  groupLimit: number | undefined,
  state: WebformState,
  formContext: { fields: Record<string, WebformFieldProps> },
): string[] => {
  if (!group || !groupLimit) return val

  const groupFields = Object.keys(formContext.fields).filter((key) => {
    const field = formContext.fields[key]

    return field && field['#group'] === group
  })

  groupFields.forEach((key) => {
    if (key !== fieldName && Array.isArray(state[key]) && state[key].length) {
      state[key] = []
    }
  })

  const fieldMaxLimit =
    formContext.fields[fieldName]?.['#maxSelected'] ?? Infinity

  return enforceMaxSelected(val, fieldMaxLimit)
}
