export type InputType =
  | 'text'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'password'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'time'
  | 'week'
  | 'color'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkboxes'
  | 'range'
  | 'hidden'
  | 'processed_text'
  | 'datetime'
  | 'section'
  | 'file'
  | 'managed_file'
  | 'webform_document_file'
  | 'webform_image_file'
  | 'webform_audio_file'
  | 'webform_video_file'

export interface DrupalFormProps {
  formId: string
  attributes: Record<string, unknown>
  method: string
  content?: string
}

export interface WebformProps {
  id?: number
  uuid?: string
  parentUuid?: string
  region?: string
  webform?: WebformDefinition
  align?: string
  width?: string
  spacing?: string
  editLink?: string
  onClose?: () => void
}

export interface WebformDefinition {
  webformId: string
  webformTitle: string
  webformConfirmation: string
  webformSubmissions: string
  fields: Record<string, WebformFieldProps>
  actions: WebformActionProps[]
}

/**
 * Types for State Conditions (Visible, Disabled, Checked)
 */
export type ConditionEntry = Record<string, { value: string }> | 'or'
export type ConditionType = ConditionEntry[] | Record<string, { value: string }>

export interface States {
  visible?: ConditionType
  disabled?: ConditionType
  checked?: ConditionType
}

export interface WebformOptionProperties {
  price?: number
  description?: string
  range?: [number?, number?]
  checkAgainst?: string
  disableWhen?: {
    field?: string
    includes?: string
  }
  linked_to?: string[]
  linkedTo?: string[]
}

export interface WebformFieldProps {
  [key: string]: unknown
  '#type': InputType
  '#title': string
  '#value'?: number | string
  '#name': string
  '#description'?: string
  '#placeholder'?: string
  '#autocomplete'?: string
  '#pattern'?: string
  '#input_type'?: string
  '#inputType'?: string
  '#widget'?: string
  '#required'?: boolean
  '#requiredError'?: string
  '#options'?: Record<string, string>
  '#optionProperties'?: Record<string, WebformOptionProperties>
  '#text'?: string
  '#min'?: number
  '#max'?: number
  '#step'?: number
  '#accept'?: string
  '#file_extensions'?: string
  '#upload_validators'?: Record<string, unknown>
  '#multiple'?: number | boolean
  '#states'?: States
  '#group'?: string
  '#groupMaxSelected'?: number
  '#perGuest'?: boolean
  '#isTaxable'?: boolean
  '#serviceFeeApplicable'?: boolean
  '#maxSelected'?: number
  '#minSelected'?: number
  floatingLabel?: boolean
  '#composite'?: Record<string, WebformFieldProps>
}

export interface GroupField extends WebformFieldProps {
  children?: Record<string, WebformFieldProps>
}

export interface WebformActionProps {
  [key: string]: unknown
  '#type': string
  '#title': string
  '#submit_label'?: string
  '#submit_Label'?: string
}

export type WebformState = Record<
  string,
  | string
  | number
  | boolean
  | string[]
  | File
  | File[]
  | Record<string, unknown>
  | undefined
>

export type WebformFields = Record<string, WebformFieldProps>
