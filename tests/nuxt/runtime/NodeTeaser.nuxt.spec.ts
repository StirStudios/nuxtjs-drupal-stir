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
  it('renders the post date, title and a named stretched link without UBlogPost', async () => {
    const wrapper = await mountSuspended(NodeTeaser, {
      props: {
        teaser: {},
        title: 'Card title',
        url: '/news/card',
        created: '2026-03-04T12:00:00Z',
        showDate: true,
      },
    })

    const time = wrapper.get('time')

    expect(time.attributes('datetime')).toBe('2026-03-04T00:00:00.000Z')
    expect(time.text()).toBe('Mar 4, 2026')
    expect(wrapper.get('h2').text()).toBe('Card title')
    expect(wrapper.get('a').attributes('aria-label')).toBe('Card title')
    expect(wrapper.findComponent({ name: 'UBlogPost' }).exists()).toBe(false)
  })

  it('omits the date when it is blank or hidden', async () => {
    const blank = await mountSuspended(NodeTeaser, {
      props: { teaser: {}, title: 'Card title', created: '', showDate: true },
    })
    const hidden = await mountSuspended(NodeTeaser, {
      props: { teaser: {}, title: 'Card title', created: '2026-03-04', showDate: false },
    })

    expect(blank.find('time').exists()).toBe(false)
    expect(hidden.find('time').exists()).toBe(false)
  })
})
