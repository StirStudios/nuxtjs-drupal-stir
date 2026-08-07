import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import NodeTeaser from '../../../layers/theme/app/components/global/NodeTeaser.vue'

describe('NodeTeaser (Nuxt runtime)', () => {
  it('keeps configured media rounding only on the outside card corners', async () => {
    const wrapper = await mountSuspended(NodeTeaser, {
      props: {
        teaser: {
          media: {
            src: '/card.webp',
            alt: 'Card image',
          },
        },
        title: 'Card title',
      },
    })

    expect(wrapper.getComponent({ name: 'MediaImage' }).props('roundedClass'))
      .toBe('rounded-xl rounded-b-none')
  })
})
