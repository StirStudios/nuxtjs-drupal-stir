import type { WebformFieldProps, WebformState } from '~/types'

export const webformState = reactive<{
  state: WebformState
  fields: Record<string, WebformFieldProps>
}>({
  state: {},
  fields: {},
})
