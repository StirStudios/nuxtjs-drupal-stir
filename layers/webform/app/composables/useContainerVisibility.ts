import type { WebformFieldProps, WebformState } from '#stir/types'
import { resolveWebformFieldStates } from '#stir-webform/utils/webformConditions'

export function evaluateContainerVisibility(
  containerName: string,
  state: WebformState,
  fields: Record<string, WebformFieldProps>,
  getGroupFields: (parentName: string) => string[],
): boolean {
  return getGroupFields(containerName).some((fieldName) => {
    const field = fields[fieldName]

    return field ? resolveWebformFieldStates(field, state).visible : true
  })
}
