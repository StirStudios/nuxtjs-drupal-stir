import type { DrupalMediaType } from '#stir/types'

export const drupalMediaTypes = [
  'audio',
  'document',
  'image',
  'link',
  'video',
] as const satisfies readonly DrupalMediaType[]

export function normalizeDrupalMediaType(value: unknown): DrupalMediaType {
  return drupalMediaTypes.includes(value as DrupalMediaType)
    ? value as DrupalMediaType
    : 'image'
}

export const drupalMediaComponentNames: Record<DrupalMediaType, string> = {
  image: 'MediaImage',
  video: 'MediaVideo',
  document: 'MediaDocument',
  audio: 'MediaAudio',
  link: 'MediaLink',
}

export function drupalMediaComponentName(value: unknown): string {
  return drupalMediaComponentNames[normalizeDrupalMediaType(value)]
}
