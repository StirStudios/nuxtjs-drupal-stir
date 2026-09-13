import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'
import ParagraphTimeline from '../../../layers/theme/app/components/global/Paragraph/Timeline.vue'

describe('ParagraphTimeline', () => {
  it('renders each item title at its authored heading level', async () => {
    const wrapper = await mountSuspended(ParagraphTimeline, {
      slots: {
        timeline: () => [
          h('paragraph-timeline-item', {
            date: '2026',
            header: 'vNext architecture',
            headerTag: 'h3',
            icon: 'i-lucide-rocket',
            text: '<p>Explicit component contracts introduced.</p>',
          }),
        ],
      },
    })

    const heading = wrapper.get('h3')

    expect(heading.text()).toBe('vNext architecture')
  })
})
