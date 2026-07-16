import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AddressValue from '../../../layers/theme/app/components/global/address-value.vue'

describe('address-value (Nuxt runtime)', () => {
  it('renders Drupal-provided address lines semantically', async () => {
    const wrapper = await mountSuspended(AddressValue, {
      props: {
        organization: 'Royal Festival Hall',
        locality: 'London',
        countryCode: 'GB',
        lines: ['Royal Festival Hall', 'London SE1 8XX', 'GB'],
        label: 'Royal Festival Hall, London SE1 8XX, GB',
        searchQuery: 'Royal Festival Hall, London, SE1 8XX, GB',
      },
    })

    const address = wrapper.get('address')

    expect(address.attributes('aria-label')).toBe(
      'Royal Festival Hall, London SE1 8XX, GB',
    )
    expect(address.findAll('span').map((line) => line.text())).toEqual([
      'Royal Festival Hall',
      'London SE1 8XX',
      'GB',
    ])
    expect(wrapper.html()).not.toContain('google.com')
  })

  it('provides structured values to project-specific presentations', async () => {
    const wrapper = await mountSuspended(AddressValue, {
      props: {
        locality: 'Los Angeles',
        administrativeArea: 'CA',
        countryCode: 'US',
        searchQuery: 'Los Angeles, CA, US',
      },
      slots: {
        default: `<template #default="{ locality, administrativeArea, searchQuery }">
          <a :href="'https://maps.example/?q=' + encodeURIComponent(searchQuery)">
            {{ locality }}, {{ administrativeArea }}
          </a>
        </template>`,
      },
    })

    const link = wrapper.get('a')

    expect(link.text()).toContain('Los Angeles, CA')
    expect(link.attributes('href')).toBe(
      'https://maps.example/?q=Los%20Angeles%2C%20CA%2C%20US',
    )
  })
})
