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
      originalSrc: '/original.jpg',
      originalRevision: '1-2-3',
      deliveryProfile: 'card',
      title: 'Image',
    })
    const video = h('div', {
      type: 'video',
      mid: '2',
      src: '/video.jpg',
      deliveryProfile: 'card',
      title: 'Video',
    })
    const modal = useMediaModal(ref([image, video]), {
      propsOf: (node: VNode) => node.props ?? {},
    } as never)

    expect(modal.itemsOrdered.value).toMatchObject([
      {
        key: '1',
        type: 'image',
        src: '/small.jpg',
        originalSrc: '/original.jpg',
        originalRevision: '1-2-3',
        deliveryProfile: 'full',
      },
      {
        key: '2',
        type: 'video',
        src: '/video.jpg',
        deliveryProfile: 'card',
      },
    ])
  })

  it('keys items by a numeric mid instead of discarding it', () => {
    // Drupal's `mid` can arrive as a real JSON number, not just a string.
    // The key must still prefer it over falling back to src/position, or
    // two items sharing a src collide on the same Vue :key.
    const first = h('img', { type: 'image', mid: 1, src: '/shared.jpg' })
    const second = h('img', { type: 'image', mid: 2, src: '/shared.jpg' })
    const modal = useMediaModal(ref([first, second]), {
      propsOf: (node: VNode) => node.props ?? {},
    } as never)

    expect(modal.itemsOrdered.value.map(item => item.key)).toEqual(['1', '2'])
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
    expect(normalizeDrupalMediaType('basic-image')).toBe('image')
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
