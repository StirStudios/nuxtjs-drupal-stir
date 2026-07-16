export type CustomElementNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  [key: string]: unknown
}

export type DrupalMediaType = 'audio' | 'document' | 'image' | 'link' | 'video'

export type DrupalMediaSummary = {
  hasAudio: boolean
  hasVideo: boolean
  hasImage: boolean
  hasLink: boolean
  hasDocument: boolean
  count: number
}

export type DrupalMediaNodeProps = {
  type?: DrupalMediaType
  alt?: string
  credit?: string
  fetchpriority?: 'auto' | 'high' | 'low'
  height?: number
  loading?: 'eager' | 'lazy'
  mediaEmbed?: unknown
  mid?: number | string
  modalSizes?: string
  modalSrc?: string
  modalSrcset?: string
  sizes?: string
  src?: string
  srcset?: string
  title?: string
  url?: string
  width?: number
  [key: string]: unknown
}

export type NormalizedDrupalMediaNodeProps = DrupalMediaNodeProps & {
  type: DrupalMediaType
}

export type DrupalMediaSlotNode = {
  props?: Record<string, unknown>
}

export type DrupalMediaSlotsToolkit = {
  propsOf(node: DrupalMediaSlotNode): DrupalMediaNodeProps
}
