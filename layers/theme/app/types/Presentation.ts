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

export interface ParagraphLayoutRegion {
  label: string
  value: string
}

export interface ParagraphLayoutMove {
  source: string
  sourceLabel: string
  count: number
  suggestedDestination: string
}

export interface ParagraphLayoutOption {
  value: string
  label: string
  defaultRegion: string
  regions: ParagraphLayoutRegion[]
  iconMap: string[][]
  moves: ParagraphLayoutMove[]
}

export interface ParagraphLayoutContract {
  current: string
  ownerRevisionId: number | null
  options: ParagraphLayoutOption[]
}

export interface ParagraphLayoutUpdate {
  target: string
  mappings: Record<string, string>
  expectedOwnerRevisionId: number | null
}

export interface ParagraphPresentationResponse {
  ok: boolean
  paragraphId: number
  bundle: string
  fields: ParagraphPresentationField[]
  layout: ParagraphLayoutContract | null
  message?: string
}
