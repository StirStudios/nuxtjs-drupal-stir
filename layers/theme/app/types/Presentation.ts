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

export interface ParagraphLayoutChild {
  uuid: string
  paragraphId: number
  bundle: string
  label: string
  region: string
}

export interface ParagraphLayoutContract {
  current: string
  ownerRevisionId: number | null
  options: ParagraphLayoutOption[]
  children?: ParagraphLayoutChild[]
}

export interface ParagraphLayoutUpdate {
  target: string
  mappings: Record<string, string>
  expectedOwnerRevisionId: number | null
  regions?: Record<string, string[]>
}

export interface ParagraphPresentationResponse {
  ok: boolean
  paragraphId: number
  bundle: string
  fields: ParagraphPresentationField[]
  layout: ParagraphLayoutContract | null
  message?: string
}
