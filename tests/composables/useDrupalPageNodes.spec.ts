import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import {
  findDrupalPageNodesByElement,
  findDrupalPageNodesByProp,
  findDrupalPageViewNodes,
  getDrupalPageNodeViewTargetId,
  isDrupalPageMediaNode,
  isDrupalPageViewNode,
  useDrupalPageNodes,
} from '../../layers/theme/app/composables/useDrupalPageNodes'

const TestComponent = { render: () => null }

describe('useDrupalPageNodes', () => {
  it('finds paragraph view nodes by target id', () => {
    const testimonials = h(TestComponent, {
      view: [{ targetId: 'testimonials', displayId: 'block_1' }],
    })
    const work = h(TestComponent, {
      view: { targetId: 'work', displayId: 'block_1' },
    })

    expect(findDrupalPageViewNodes([testimonials, work], 'testimonials')).toEqual([
      testimonials,
    ])
    expect(getDrupalPageNodeViewTargetId(work)).toBe('work')
    expect(isDrupalPageViewNode(testimonials, 'testimonials')).toBe(true)
  })

  it('finds rendered view nodes by their normalized view id', () => {
    const rows = h(TestComponent, { viewId: 'work', displayId: 'block_1' })
    const wrapper = h(
      TestComponent,
      { element: 'paragraph-view' },
      { content: () => [rows] },
    )
    const nodes = useDrupalPageNodes(() => [wrapper])

    expect(findDrupalPageViewNodes([wrapper], 'work')).toEqual([rows])
    expect(getDrupalPageNodeViewTargetId(rows)).toBe('work')
    expect(nodes.views('work')).toEqual([rows])
    expect(nodes.isView(rows, 'work')).toBe(true)
  })

  it('finds nested nodes by element and prop', () => {
    const text = h(TestComponent, { element: 'paragraph-text', text: 'Body' })
    const image = h(TestComponent, {
      element: 'media-image',
      type: 'image',
      src: '/image.jpg',
    })
    const layout = h(
      TestComponent,
      { element: 'paragraph-layout', uuid: 'layout-1' },
      { default: () => [text, image] },
    )

    expect(findDrupalPageNodesByElement([layout], 'media-image')).toEqual([image])
    expect(findDrupalPageNodesByProp([layout], 'text', 'Body')).toEqual([text])
    expect(isDrupalPageMediaNode(image)).toBe(true)
  })

  it('queries common Drupal page node shapes', () => {
    const item = h(TestComponent, {
      element: 'paragraph-text',
      parentUuid: 'layout-1',
      region: 'items',
      text: 'Feature',
    })
    const body = h(TestComponent, { element: 'node-page', body: ['Body'] })
    const media = h(TestComponent, { element: 'media-image', type: 'image' })
    const view = h(TestComponent, { view: [{ targetId: 'testimonials' }] })
    const nodes = useDrupalPageNodes(() => [item, body, media, view])

    expect(nodes.byParent('layout-1')).toEqual([item])
    expect(nodes.byParent(null)).toEqual([])
    expect(nodes.byRegion('items')).toEqual([item])
    expect(nodes.text()).toEqual([item])
    expect(nodes.body()).toEqual([body])
    expect(nodes.media()).toEqual([media])
    expect(nodes.views('testimonials')).toEqual([view])
    expect(nodes.isView(view, 'testimonials')).toBe(true)
    expect(nodes.isMedia(media)).toBe(true)
  })

  it('treats all supported Drupal media custom elements as media nodes', () => {
    const image = h(TestComponent, { element: 'media-image', type: 'image' })
    const video = h(TestComponent, { element: 'media-video', type: 'video' })
    const document = h(TestComponent, { element: 'media-document', type: 'document' })
    const audio = h(TestComponent, { element: 'media-audio', type: 'audio' })
    const link = h(TestComponent, { element: 'media-link', type: 'link' })
    const text = h(TestComponent, { element: 'paragraph-text', type: 'text' })

    expect([image, video, document, audio, link].every(isDrupalPageMediaNode)).toBe(true)
    expect(isDrupalPageMediaNode(text)).toBe(false)
  })
})
