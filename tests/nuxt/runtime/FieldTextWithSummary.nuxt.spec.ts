import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FieldTextWithSummary from '../../../layers/theme/app/components/global/field-text-with-summary.vue'

describe('field-text-with-summary (Nuxt runtime)', () => {
  it('renders Drupal-filtered full text ahead of its summary', async () => {
    const wrapper = await mountSuspended(FieldTextWithSummary, {
      props: {
        value: '<p>Complete article body</p>',
        summary: '<p>Short summary</p>',
      },
    })

    expect(wrapper.html()).toContain('<p>Complete article body</p>')
    expect(wrapper.text()).not.toContain('Short summary')
  })

  it('preserves upstream slot content without adding a wrapper', async () => {
    const wrapper = await mountSuspended(FieldTextWithSummary, {
      props: { summary: '<p>Fallback summary</p>' },
      slots: { default: '<article>Rendered by Drupal</article>' },
    })

    expect(wrapper.html()).toContain('<article>Rendered by Drupal</article>')
    expect(wrapper.text()).not.toContain('Fallback summary')
  })

  it('exposes summary data to project-specific presentations', async () => {
    const wrapper = await mountSuspended(FieldTextWithSummary, {
      props: { summary: 'A concise card description' },
      slots: {
        default: `<template #default="{ summary }">
          <p class="card-summary">{{ summary }}</p>
        </template>`,
      },
    })

    expect(wrapper.get('.card-summary').text()).toBe(
      'A concise card description',
    )
  })
})
