export type ParagraphPresentationKey = string

export interface ParagraphPresentationOption {
  label: string
  value: string
}

export interface ParagraphPresentationField {
  key: ParagraphPresentationKey
  fieldName: string
  label: string
  description?: string
  type: 'boolean' | 'select' | 'multiselect'
  value: boolean | string | string[]
  options?: ParagraphPresentationOption[]
}

export interface ParagraphPresentationResponse {
  ok: boolean
  paragraphId: number
  bundle: string
  fields: ParagraphPresentationField[]
  message?: string
}
