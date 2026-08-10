import type { WebformFieldProps } from '#stir/types'

const DISPLAY_ELEMENT_TYPES = new Set([
  'processed_text',
  'webform_markup',
])

export function isWebformDisplayElement(
  field: Pick<WebformFieldProps, '#type'>,
): boolean {
  return DISPLAY_ELEMENT_TYPES.has(field['#type'])
}
