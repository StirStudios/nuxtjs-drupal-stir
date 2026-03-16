import type { WebformFieldProps, WebformState } from '~/types'
import { evaluateCondition } from '~/utils/evaluateUtils'

export function evaluateContainerVisibility(
  containerName: string,
  state: WebformState,
  fields: Record<string, WebformFieldProps>,
  getGroupFields: (parentName: string) => string[],
): boolean {
  return getGroupFields(containerName).some((fieldName) => {
    return evaluateCondition(fields[fieldName]?.['#states']?.visible, state, true)
  })
}
