import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import Webform from '../../../layers/webform/app/components/WebformForm.vue'
import ParagraphWebform from '../../../layers/webform/app/components/global/Paragraph/Webform.vue'
import type { WebformDefinition } from '../../../layers/theme/app/types'

const webform = {
  actions: [{ '#type': 'submit', '#title': 'Submit' }],
  fields: {
    name: {
      '#name': 'name',
      '#required': true,
      '#title': 'Name',
      '#type': 'text',
    },
  },
  webformConfirmation: 'Thank you',
  webformConfirmationType: 'message',
  webformId: 'contact',
  webformRedirect: null,
  webformSubmissions: null,
  webformTitle: 'Contact',
} satisfies WebformDefinition

describe('Webform (Nuxt runtime)', () => {
  it('loads validation when the lazy-hydrated form mounts', async () => {
    const wrapper = await mountSuspended(Webform, {
      props: { webform },
    })

    await flushPromises()

    await vi.waitFor(() => {
      expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    })
  })

  it('forwards Drupal props through the lazy hydration boundary', async () => {
    const wrapper = await mountSuspended(ParagraphWebform, {
      props: { webform },
    })

    await vi.waitFor(() => {
      expect(wrapper.get('form')).toBeDefined()
      expect(wrapper.text()).toContain('Name')
      expect(wrapper.get('button[type="submit"]').text()).toBe('Submit')
    })
  })
})
