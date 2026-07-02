import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import { useNodeTeaser } from '../../layers/theme/app/composables/useNode'

const TestComponent = { render: () => null }

describe('useNodeTeaser', () => {
  it('extracts nested section text and hero media for teaser rows', () => {
    const image = h(TestComponent, {
      element: 'media-image',
      src: '/card.jpg',
      alt: 'Card image',
    })
    const hero = h(
      TestComponent,
      { element: 'paragraph-hero' },
      { media: () => [image] },
    )
    const text = h(TestComponent, {
      element: 'paragraph-text',
      text: '<p>Nested teaser text</p>',
      editLink: 'https://cms.local/stir_layout_builder/node/1/paragraphs/2/edit',
    })
    const layout = h(
      TestComponent,
      { element: 'paragraph-layout' },
      { default: () => [text] },
    )

    const teaser = useNodeTeaser({
      hero: () => [hero],
      section: () => [layout],
    })

    expect(teaser.value.text).toBe('<p>Nested teaser text</p>')
    expect(teaser.value.media).toEqual({
      element: 'media-image',
      src: '/card.jpg',
      alt: 'Card image',
    })
    expect(teaser.value.props.editLink).toBe(
      'https://cms.local/stir_layout_builder/node/1/paragraphs/2/edit',
    )
  })
})
