import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import {
  getAllVNodes,
  getVNodeProps,
  getVNodeChildren,
  getVNodeSlotChildren,
  useSlotsToolkit,
  useSlotVNode,
} from '../../layers/theme/app/composables/useSlotsToolkit'

describe('useSlotsToolkit VNode traversal', () => {
  it('reads VNodes from normal slot arrays', () => {
    const mediaNode = h('img', { src: '/media.jpg' })

    expect(useSlotVNode({ media: () => [mediaNode] }, 'media')).toEqual([mediaNode])
  })

  it('reads VNodes from slot functions that return a single VNode', () => {
    const mediaNode = h('img', { src: '/media.jpg' })

    expect(useSlotVNode({ media: () => mediaNode }, 'media')).toEqual([mediaNode])
  })

  it('ignores non-VNode slot function returns', () => {
    expect(useSlotVNode({ media: () => 'plain text' }, 'media')).toEqual([])
    expect(useSlotVNode({ media: () => null }, 'media')).toEqual([])
  })

  it('reads nested children from object slots that return arrays or single VNodes', () => {
    const headerNode = h('h2', 'Title')
    const mediaNode = h('img', { src: '/media.jpg' })
    const rootNode = h(
      { render: () => null },
      null,
      {
        header: () => [headerNode],
        media: () => mediaNode,
        text: () => 'plain text',
      },
    )

    expect(getVNodeChildren(rootNode)).toEqual([headerNode, mediaNode])
  })

  it('reads children from one named object slot safely', () => {
    const headerNode = h('h2', 'Title')
    const mediaNode = h('img', { src: '/media.jpg' })
    const rootNode = h(
      { render: () => null },
      null,
      {
        header: () => [headerNode],
        media: () => mediaNode,
      },
    )

    expect(getVNodeSlotChildren(rootNode, 'media')).toEqual([mediaNode])
    expect(getVNodeSlotChildren(rootNode, 'header')).toEqual([headerNode])
  })

  it('walks all nested VNodes without throwing on mixed Drupal slot shapes', () => {
    const imageNode = h('img', { src: '/media.jpg' })
    const textNode = h('p', 'Body')
    const sectionNode = h(
      { render: () => null },
      null,
      {
        media: () => imageNode,
        content: () => [textNode],
        empty: () => null,
      },
    )

    expect(getAllVNodes([sectionNode])).toEqual([sectionNode, imageNode, textNode])
  })

  it('supports typed props for downstream Drupal custom-element helpers', () => {
    type MediaProps = {
      src?: string
      mid?: string
    }

    const mediaNode = h('img', { src: '/media.jpg', mid: '10' })
    const tk = useSlotsToolkit({ media: () => [mediaNode] })

    expect(getVNodeProps<MediaProps>(mediaNode).src).toBe('/media.jpg')
    expect(tk.propsOf<MediaProps>(mediaNode).mid).toBe('10')
  })
})
