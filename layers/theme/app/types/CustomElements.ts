export type CustomElementNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  [key: string]: unknown
}

export type DrupalMediaType = 'audio' | 'document' | 'image' | 'link' | 'video'
export type DrupalMediaPayloadType = DrupalMediaType | 'basic-image'

export type DrupalMediaSummary = {
  hasAudio: boolean
  hasVideo: boolean
  hasImage: boolean
  hasLink: boolean
  hasDocument: boolean
  count: number
}

export type DrupalMediaNodeProps = {
  type?: DrupalMediaPayloadType
  alt?: string
  category?: string
  credit?: string
  deliverySizes?: string
  fetchpriority?: 'auto' | 'high' | 'low'
  height?: number
  loading?: 'eager' | 'lazy'
  mediaEmbed?: unknown
  mid?: number | string
  modalSizes?: string
  modalSrc?: string
  modalSrcset?: string
  modalResponsiveStyle?: string
  originalRevision?: string
  originalSrc?: string
  link?: string
  rel?: 'noopener'
  responsiveStyle?: string
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
