import type { WebformFieldProps } from '#stir/types'

/**
 * Field types FieldRenderer has a component for, after the payload boundary
 * has resolved aliases. Keep in step with its component map.
 */
export const WEBFORM_FIELD_TYPES = new Set([
  'textfield',
  'email',
  'url',
  'tel',
  'time',
  'number',
  'range',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'checkboxes',
  'datetime',
  'date',
  'address',
  'webform_likert',
  'processed_text',
  'webform_markup',
  'file',
  'managed_file',
  'webform_document_file',
  'webform_image_file',
  'webform_audio_file',
  'webform_video_file',
])

// Input types that take several values as one input each.
const MULTIPLE_INPUT_TYPES = new Set([
  'textfield',
  'email',
  'url',
  'tel',
  'time',
  'number',
  'textarea',
])

// Containers group fields; the flattened field list keeps a section for its
// heading, and none holds a value.
export const WEBFORM_CONTAINER_TYPES = ['section', 'fieldset', 'details', 'webform_section']

export function isWebformContainer(field: WebformFieldProps): boolean {
  return WEBFORM_CONTAINER_TYPES.includes(field['#type'])
}

export function isCompositeField(field: WebformFieldProps): boolean {
  const composite = field['#composite']

  return Boolean(composite) && typeof composite === 'object' && !Array.isArray(composite)
}

/**
 * Whether the layer can render a field. Any other field is reported, left
 * out of the form and its validation, and left to Drupal to judge.
 */
export function isSupportedWebformField(field: WebformFieldProps): boolean {
  return field['#type'] === 'hidden'
    || isCompositeField(field)
    || WEBFORM_FIELD_TYPES.has(field['#type'])
}

export function takesMultipleInputs(field: WebformFieldProps): boolean {
  return field['#multiple'] === true && MULTIPLE_INPUT_TYPES.has(field['#type'])
}

/**
 * The most values a multiple field accepts; unlimited when Drupal sets none.
 */
export function maxWebformValues(field: WebformFieldProps): number {
  const cardinality = Number(field['#cardinality'])

  return Number.isFinite(cardinality) && cardinality > 1 ? cardinality : Number.POSITIVE_INFINITY
}
