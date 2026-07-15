import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EntityReference from '../../../layers/theme/app/components/global/entity-reference.vue'

describe('entity-reference (Nuxt runtime)', () => {
  it('renders the normalized Drupal label as a link', async () => {
    const wrapper = await mountSuspended(EntityReference, {
      props: {
        id: '7',
        entityType: 'taxonomy_term',
        type: 'taxonomy_term',
        bundle: 'level',
        label: 'Intermediate',
        url: '/levels/intermediate',
      },
    })

    const link = wrapper.get('a')

    expect(link.text()).toBe('Intermediate')
    expect(link.attributes('href')).toBe('/levels/intermediate')
  })

  it('supports legacy payloads and a visible fallback without a URL', async () => {
    const wrapper = await mountSuspended(EntityReference, {
      props: {
        id: '7',
        type: 'taxonomy_term',
      },
    })

    expect(wrapper.get('span').text()).toBe('taxonomy_term 7')
  })

  it('forwards presentation attributes and exposes normalized slot values', async () => {
    const wrapper = await mountSuspended(EntityReference, {
      attrs: { class: 'project-reference', 'data-card': 'level' },
      props: {
        id: '7',
        entityType: 'taxonomy_term',
        label: 'Intermediate',
        url: '/levels/intermediate',
      },
      slots: {
        default: `<template #default="{ label, entityType }">
          {{ label }} ({{ entityType }})
        </template>`,
      },
    })

    const link = wrapper.get('a')

    expect(link.classes()).toContain('project-reference')
    expect(link.attributes('data-card')).toBe('level')
    expect(link.text()).toContain('Intermediate (taxonomy_term)')
  })
})
