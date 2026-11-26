import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import IconsSocial from '../../../layers/theme/app/components/Icons/Social.vue'
import ParagraphFeature from '../../../layers/theme/app/components/global/Paragraph/Feature.vue'
import ParagraphTabs from '../../../layers/theme/app/components/global/Paragraph/Tabs.vue'

describe('blank authored names (Nuxt runtime)', () => {
  it('names a tab by its position when its title is blank', async () => {
    const wrapper = await mountSuspended(ParagraphTabs, {
      slots: {
        tab: () => [
          h('div', { title: 'Overview' }),
          h('div', { title: '   ' }),
          h('div'),
        ],
      },
    })

    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['Overview', 'Tab 2', 'Tab 3'])
  })

  it('renders no heading for a whitespace-only feature header', async () => {
    const wrapper = await mountSuspended(ParagraphFeature, { props: { header: '   ', headerTag: 'h3' } })

    expect(wrapper.find('h3').exists()).toBe(false)
  })

  it.each([
    { title: 'Instagram', label: 'Visit our Instagram page' },
    { title: '  ', label: 'Visit our social page' },
    { title: undefined, label: 'Visit our social page' },
  ])('labels a social link "$label"', async ({ title, label }) => {
    const wrapper = await mountSuspended(IconsSocial, {
      props: { title, url: 'https://social.example.com/stir', icon: 'i-lucide-link' },
    })

    expect(wrapper.get('a').attributes('aria-label')).toBe(label)
  })
})
