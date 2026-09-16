import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import WebformContent from '../../../layers/webform/app/components/WebformContent.vue'
import Webform from '../../../layers/webform/app/components/WebformForm.vue'
import ParagraphWebform from '../../../layers/webform/app/components/global/Paragraph/Webform.vue'
import type { WebformDefinition } from '../../../layers/theme/app/types'

const runtime = vi.hoisted(() => ({
  fetch: vi.fn(),
}))

mockNuxtImport('$fetch', () => runtime.fetch)

const webform = {
  schemaVersion: 1,
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
  it('keeps submission disabled until security verification completes', async () => {
    const wrapper = await mountSuspended(WebformContent, {
      props: {
        fields: {},
        state: {},
        isFormSubmitted: false,
        isLoading: false,
        isSchemaReady: true,
        orderedFieldNames: [],
        themeWebform: {},
        groupedFields: {},
        shouldRenderGroupContainer: () => false,
        shouldRenderIndividualField: () => false,
        getGroupFields: () => [],
        isContainerVisible: () => true,
        submitButtonLabel: 'Submit',
        webformConfirmation: '',
        turnstileToken: '',
      },
    })

    await flushPromises()

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.setProps({ turnstileToken: 'token' })
    await flushPromises()

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
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

  it('fills flex regions up to the selected content width', async () => {
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform,
        width: 'md',
      },
    })

    await flushPromises()

    expect([...wrapper.get('form').element.parentElement!.classList]).toEqual(
      expect.arrayContaining(['w-full', 'mx-auto', 'lg:max-w-3xl']),
    )
  })

  it('starts a textarea at the height Drupal configured', async () => {
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform: {
          ...webform,
          fields: {
            message: {
              '#name': 'message',
              '#rows': 4,
              '#title': 'Message',
              '#type': 'textarea',
            },
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.get('textarea').attributes('rows')).toBe('4')
  })

  it('keeps a single-row textarea when Drupal sets no height', async () => {
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform: {
          ...webform,
          fields: {
            message: {
              '#name': 'message',
              '#title': 'Message',
              '#type': 'textarea',
            },
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.get('textarea').attributes('rows')).toBe('1')
  })

  it('maps structured Drupal alignment instead of treating it as classes', async () => {
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform,
        width: 'xs',
        align: { justify: 'start' },
      },
    })

    await flushPromises()

    const formWrapper = [...wrapper.get('form').element.parentElement!.classList]

    expect(formWrapper).toEqual(expect.arrayContaining(['w-full', 'sm:max-w-lg']))
    expect(formWrapper).not.toContain('mx-auto')
    expect(wrapper.html()).not.toContain('[object Object]')
  })

  it('does not submit display-only markup as an empty field', async () => {
    runtime.fetch.mockClear()
    runtime.fetch.mockResolvedValue(undefined)
    const displayOnlyWebform: WebformDefinition = {
      ...webform,
      fields: {
        notice: {
          '#type': 'webform_markup',
          '#name': 'notice',
          '#markup': '<p>Privacy notice</p>',
        },
      },
    }
    const wrapper = await mountSuspended(Webform, {
      props: { webform: displayOnlyWebform },
    })

    await flushPromises()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const submissions = runtime.fetch.mock.calls.filter(
      ([url]) => url === '/api/webform/submit',
    )

    expect(submissions).toHaveLength(1)
    const options = submissions[0]?.[1] as { body: string }

    expect(JSON.parse(options.body)).toEqual({
      webform_id: 'contact',
      turnstile_response: '',
    })
  })
})
