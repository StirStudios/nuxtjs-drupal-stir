import type { WebformFieldProps, WebformState } from '../../../theme/app/types'

export const webformState = reactive<{
  state: WebformState
  fields: Record<string, WebformFieldProps>
}>({
  state: {},
  fields: {},
})
