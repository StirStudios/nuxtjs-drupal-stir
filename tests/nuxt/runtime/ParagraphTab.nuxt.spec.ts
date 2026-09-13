import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ParagraphTab from '../../../layers/theme/app/components/global/Paragraph/Tab.vue'

describe('ParagraphTab', () => {
  it('renders its content-area header at the authored heading level', async () => {
    const wrapper = await mountSuspended(ParagraphTab, {
      props: {
        header: 'Overview',
        headerTag: 'h3',
        title: 'Overview',
      },
      slots: {
        tabContent: '<p>Tab body</p>',
      },
    })

    expect(wrapper.get('h3').text()).toBe('Overview')
  })

  it('renders no heading when no header is authored', async () => {
    const wrapper = await mountSuspended(ParagraphTab, {
      slots: {
        tabContent: '<p>Tab body</p>',
      },
    })

    expect(wrapper.find('h2, h3, h4, div.mb-4').exists()).toBe(false)
  })

  it('renders no heading for a whitespace-only header', async () => {
    const wrapper = await mountSuspended(ParagraphTab, {
      props: {
        header: '   ',
        headerTag: 'h3',
      },
      slots: {
        tabContent: '<p>Tab body</p>',
      },
    })

    expect(wrapper.find('h2, h3, h4, div.mb-4').exists()).toBe(false)
  })
})
