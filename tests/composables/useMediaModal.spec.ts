import { describe, expect, it } from 'vitest'
import type { VNode } from 'vue'
import { h, ref } from 'vue'
import { useMediaModal } from '../../layers/theme/app/composables/useMediaModal'
import {
  drupalMediaComponentName,
  normalizeDrupalMediaType,
} from '../../layers/theme/app/utils/drupalMediaTypes'

describe('useMediaModal', () => {
  it('normalizes supported media items for modal rendering', () => {
    const image = h('img', {
      type: 'image',
      mid: '1',
      src: '/small.jpg',
      modalSrc: '/large.jpg',
      modalSrcset: '/large.jpg 1200w',
      modalSizes: '100vw',
      title: 'Image',
    })
    const video = h('div', {
      type: 'video',
      mid: '2',
      src: '/video.jpg',
      title: 'Video',
    })
    const modal = useMediaModal(ref([image, video]), {
      propsOf: (node: VNode) => node.props ?? {},
    } as never)

    expect(modal.itemsOrdered.value).toMatchObject([
      {
        key: '1',
        type: 'image',
        src: '/large.jpg',
        srcset: '/large.jpg 1200w',
        sizes: '100vw',
      },
      {
        key: '2',
        type: 'video',
        src: '/video.jpg',
      },
    ])
  })

  it('falls back unknown media types to image', () => {
    const item = h('div', {
      type: 'unsupported',
      src: '/fallback.jpg',
    })
    const modal = useMediaModal(ref([item]), {
      propsOf: (node: VNode) => node.props ?? {},
    } as never)

    expect(modal.itemsOrdered.value[0]?.type).toBe('image')
  })

  it('normalizes media types through the shared Drupal media helper', () => {
    expect(normalizeDrupalMediaType('audio')).toBe('audio')
    expect(normalizeDrupalMediaType('document')).toBe('document')
    expect(normalizeDrupalMediaType('image')).toBe('image')
    expect(normalizeDrupalMediaType('link')).toBe('link')
    expect(normalizeDrupalMediaType('video')).toBe('video')
    expect(normalizeDrupalMediaType('unknown')).toBe('image')
    expect(normalizeDrupalMediaType(undefined)).toBe('image')
  })

  it('resolves media component names from normalized media types', () => {
    expect(drupalMediaComponentName('audio')).toBe('MediaAudio')
    expect(drupalMediaComponentName('document')).toBe('MediaDocument')
    expect(drupalMediaComponentName('image')).toBe('MediaImage')
    expect(drupalMediaComponentName('link')).toBe('MediaLink')
    expect(drupalMediaComponentName('video')).toBe('MediaVideo')
    expect(drupalMediaComponentName('unknown')).toBe('MediaImage')
  })
})
