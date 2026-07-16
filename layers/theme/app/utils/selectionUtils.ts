import type {
  WebformFieldProps,
  WebformOptionProperties,
  WebformState,
} from '#stir/types'
import { normalizeValue } from './stringUtils'

export const syncLinkedSelections = (
  selectedValues: string[],
  currentValues: string[],
  optionProperties: Record<string, WebformOptionProperties>,
  disabledKeys: ReadonlySet<string> = new Set(),
): string[] => {
  const optionKeys = Object.keys(optionProperties)
  const resolveKey = (raw: string): string =>
    optionKeys.find(key => normalizeValue(key) === normalizeValue(raw)) ?? raw
  const allLinkedKeys = new Set(
    Object.values(optionProperties).flatMap((properties) =>
      [...(properties.linked_to ?? []), ...(properties.linkedTo ?? [])]
        .map(resolveKey),
    ),
  )
  const explicitlySelected = new Set(selectedValues.map(normalizeValue))
  const requiredLinkedKeys = new Set<string>()
  const updated = [...currentValues]

  for (let index = 0; index < updated.length; index += 1) {
    const selectedKey = resolveKey(updated[index] ?? '')
    const properties = optionProperties[selectedKey]
    const linkedKeys = [
      ...(properties?.linked_to ?? []),
      ...(properties?.linkedTo ?? []),
    ]

    for (const rawLinkedKey of linkedKeys) {
      const linkedKey = resolveKey(rawLinkedKey)

      requiredLinkedKeys.add(linkedKey)

      if (!updated.includes(linkedKey) && !disabledKeys.has(linkedKey)) {
        updated.push(linkedKey)
      }
    }
  }

  return updated.filter((key) =>
    !allLinkedKeys.has(resolveKey(key))
    || requiredLinkedKeys.has(resolveKey(key))
    || explicitlySelected.has(normalizeValue(key)),
  )
}

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
