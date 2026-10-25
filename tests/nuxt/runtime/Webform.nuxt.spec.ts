import { describe, expect, it, vi } from 'vitest'
import { useAppConfig } from '#imports'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import WebformContent from '../../../layers/webform/app/components/WebformContent.vue'
import Webform from '../../../layers/webform/app/components/WebformForm.vue'
import ParagraphWebform from '../../../layers/webform/app/components/global/Paragraph/Webform.vue'
import type { WebformDefinition } from '../../../layers/theme/app/types'
import kitchenSink from '../../../contracts/stir-tools/v1/fixtures/webform-kitchen-sink.json'
import kitchenSinkSubmission from '../../../contracts/stir-tools/v1/fixtures/webform-kitchen-sink-submission.json'

// The kitchen sink without anything required, so an untouched form submits.
function optional(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(optional)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !['#required', '#conditions', '#states'].includes(key))
      .map(([key, item]) => [key, optional(item)]),
  )
}

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

  it('styles a wizard page heading with wizardPageTitle, keeping it for focus', async () => {
    const theme = useAppConfig().stirTheme.webform as Record<string, unknown>
    const mountWizard = () => mountSuspended(Webform, {
      props: {
        webform: {
          ...webform,
          fields: {
            first: { '#type': 'webform_wizard_page', '#name': 'first', '#title': 'Pick your time', children: { name: { '#type': 'textfield', '#name': 'name', '#title': 'Name' } } },
          },
        } as unknown as WebformDefinition,
      },
    })

    theme.wizardPageTitle = 'sr-only'
    const hidden = await mountWizard()

    await flushPromises()
    expect(hidden.get('h2[tabindex="-1"]').classes()).toContain('sr-only')
    hidden.unmount()

    delete theme.wizardPageTitle
    const shown = await mountWizard()

    await flushPromises()
    expect(shown.get('h2[tabindex="-1"]').classes()).not.toContain('sr-only')
    shown.unmount()
  })

  it('fills prepopulated fields from the prefill prop', async () => {
    const wrapper = await mountSuspended(Webform, {
      props: {
        prefill: { name: 'Ada', topic: 'nope' },
        webform: {
          ...webform,
          fields: {
            name: { '#name': 'name', '#prepopulate': true, '#title': 'Name', '#type': 'textfield' },
            topic: { '#name': 'topic', '#options': { a: 'A' }, '#prepopulate': true, '#title': 'Topic', '#type': 'select' },
            notes: { '#name': 'notes', '#title': 'Notes', '#type': 'textfield' },
          },
        },
      },
    })

    await flushPromises()

    expect((wrapper.get('input[name="name"]').element as HTMLInputElement).value).toBe('Ada')
    wrapper.unmount()
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

  it('keeps the visitor\'s place when a submission is refused', async () => {
    runtime.fetch.mockClear()
    runtime.fetch.mockRejectedValue(Object.assign(new Error('Bad Request'), {
      response: { _data: { message: 'CAPTCHA validation failed' } },
    }))
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform: {
          ...webform,
          fields: { name: { ...webform.fields.name, '#required': false } },
        },
      },
    })

    await flushPromises()
    const content = wrapper.findComponent(WebformContent)

    content.vm.$emit('update:turnstileToken', 'spent-token')
    content.props('state').name = 'Ada'

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(runtime.fetch).toHaveBeenCalledWith('/api/webform/submit', expect.anything())
    // The same form stays mounted, so the visitor keeps their place and what
    // they entered; clearing the spent token asks Turnstile for a fresh one.
    expect(wrapper.findComponent(WebformContent).vm.$.uid).toBe(content.vm.$.uid)
    expect(wrapper.findComponent(WebformContent).props('state').name).toBe('Ada')
    expect(wrapper.findComponent(WebformContent).props('turnstileToken')).toBe('')
    expect(wrapper.findComponent(WebformContent).props('submissionError'))
      .toBe('Error submitting form: CAPTCHA validation failed')
  })

  it('shows a refusal inline only when toasts are off', async () => {
    const props = {
      fields: {},
      state: {},
      isFormSubmitted: false,
      isLoading: false,
      isSchemaReady: true,
      orderedFieldNames: [],
      groupedFields: {},
      shouldRenderGroupContainer: () => false,
      shouldRenderIndividualField: () => false,
      getGroupFields: () => [],
      isContainerVisible: () => true,
      submitButtonLabel: 'Submit',
      webformConfirmation: '',
      turnstileToken: 'token',
      submissionError: 'Error submitting form: CAPTCHA validation failed',
    }
    const silent = await mountSuspended(WebformContent, {
      props: { ...props, themeWebform: { showToasts: false } },
    })
    const toasting = await mountSuspended(WebformContent, {
      props: { ...props, themeWebform: {} },
    })

    await flushPromises()

    expect(silent.get('[role="alert"]').text()).toBe('Error submitting form: CAPTCHA validation failed')
    expect(toasting.find('[role="alert"]').exists()).toBe(false)
  })

  it('leaves validation to the form, with an inline error for each required field', async () => {
    runtime.fetch.mockClear()
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform: {
          ...webform,
          fields: {
            name: { ...webform.fields.name, '#requiredError': 'Enter your name' },
            venue: {
              '#type': 'select',
              '#name': 'venue',
              '#title': 'Venue',
              '#required': true,
              '#requiredError': 'Choose a venue',
              '#options': { Hall: 'Hall', Barn: 'Barn' },
              '#optionKeys': ['Hall', 'Barn'],
            },
          },
        },
      },
    })

    await flushPromises()

    const form = wrapper.get('form')

    // Controls stay marked required for assistive technology, but the browser's
    // own check would cancel the submit before the form's validation ran.
    expect((form.element as HTMLFormElement).noValidate).toBe(true)
    expect(wrapper.get('input[name="name"]').attributes('aria-required')).toBe('true')
    expect(wrapper.get('button[role="combobox"]').attributes('aria-required')).toBe('true')

    await form.trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter your name')
    expect(wrapper.text()).toContain('Choose a venue')
    expect(runtime.fetch.mock.calls.filter(([url]) => url === '/api/webform/submit')).toHaveLength(0)
  })

  it('steps through Drupal wizard pages, validating each before the next', async () => {
    runtime.fetch.mockClear()
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform: {
          ...webform,
          fields: {
            about: {
              '#type': 'webform_wizard_page',
              '#name': 'about',
              '#title': 'About you',
              '#nextButtonLabel': 'Continue',
              children: {
                name: { ...webform.fields.name, '#type': 'textfield', '#requiredError': 'Enter your name' },
              },
            },
            details: {
              '#type': 'webform_wizard_page',
              '#name': 'details',
              '#title': 'Details',
              '#prevButtonLabel': 'Change your name',
              children: {
                notes: { '#type': 'textarea', '#name': 'notes', '#title': 'Notes' },
              },
            },
          },
        } as unknown as WebformDefinition,
      },
    })

    await flushPromises()
    const buttons = () => wrapper.findAll('button').map((button) => button.text())

    expect(wrapper.text()).toContain('Step 1 of 2')
    expect(wrapper.find('input[name="name"]').exists()).toBe(true)
    expect(wrapper.find('textarea[name="notes"]').exists()).toBe(false)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)

    const next = () => wrapper.findAll('button').find((button) => button.text() === 'Continue')!

    await next().trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Enter your name')
    expect(wrapper.text()).toContain('Step 1 of 2')

    wrapper.findComponent(WebformContent).props('state').name = 'Ada'
    await next().trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Step 2 of 2')
    expect(wrapper.findAll('[data-slot="trigger"]')).toHaveLength(2)
    expect(wrapper.find('textarea[name="notes"]').exists()).toBe(true)
    expect(wrapper.find('input[name="name"]').exists()).toBe(false)
    expect(buttons()).toContain('Change your name')
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(runtime.fetch.mock.calls.filter(([url]) => url === '/api/webform/submit')).toHaveLength(0)
  })

  it('offers Next, not Submit, on a chooser whose answer reveals the later pages', async () => {
    const onlyFor = (value: string) => ({
      '#states': { visible: { ':input[name="path"]': { value } } },
      '#conditions': [{ state: 'visible', logic: 'and', rules: [{ name: 'path', selector: ':input[name="path"]', triggers: [{ trigger: 'value', value }] }] }],
    })
    const wrapper = await mountSuspended(Webform, {
      props: {
        webform: {
          ...webform,
          fields: {
            start: {
              '#type': 'webform_wizard_page',
              '#name': 'start',
              '#title': 'Get started',
              children: {
                path: { '#type': 'radio', '#name': 'path', '#title': 'Path', '#required': true, '#options': { book: 'Book', info: 'Info' }, '#optionKeys': ['book', 'info'] },
              },
            },
            book: {
              '#type': 'webform_wizard_page',
              '#name': 'book',
              '#title': 'Book',
              children: { notes: { '#type': 'textarea', '#name': 'notes', '#title': 'Notes', ...onlyFor('book') } },
            },
          },
        } as unknown as WebformDefinition,
      },
    })

    await flushPromises()

    expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
    expect(wrapper.findAll('button').some((button) => button.text() === 'Next')).toBe(true)
    // Before the answer only the chooser shows, so there is no stepper yet.
    expect(wrapper.find('[data-slot="header"] [data-slot="trigger"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Step 1 of 1')

    wrapper.findComponent(WebformContent).props('state').path = 'book'
    await flushPromises()

    // A page that asks one radio question moves on as soon as it is answered.
    expect(wrapper.text()).toContain('Step 2 of 2')
    expect(wrapper.find('textarea[name="notes"]').exists()).toBe(true)

    // Back shows the chooser with its answer, and stays there.
    await wrapper.findAll('button').find((button) => button.text() === 'Back')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Step 1 of 2')
    expect(wrapper.find('textarea[name="notes"]').exists()).toBe(false)
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

  it('renders every element of Drupal\'s kitchen sink and submits under Drupal\'s keys', async () => {
    runtime.fetch.mockClear()
    runtime.fetch.mockResolvedValue(undefined)
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountSuspended(Webform, {
      props: { webform: optional(kitchenSink) as WebformDefinition },
    })

    await flushPromises()

    for (const label of ['Full name', 'Venue', 'Organizer', 'Lineup', 'Satisfaction', 'Value for money', 'Attendees']) {
      expect(wrapper.text(), label).toContain(label)
    }
    expect(errors).not.toHaveBeenCalled()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const submissions = runtime.fetch.mock.calls.filter(([url]) => url === '/api/webform/submit')
    const body = JSON.parse((submissions[0]?.[1] as { body: string }).body) as Record<string, unknown>
    // An untouched file field sends nothing; Drupal keeps no upload.
    const { poster_image: _file, ...stored } = kitchenSinkSubmission.data

    expect(Object.keys(body).sort()).toEqual(['turnstile_response', 'webform_id', ...Object.keys(stored)].sort())
    expect(Object.keys(body.venue_address as object).sort()).toEqual(Object.keys(stored.venue_address).sort())
    expect(Object.keys((body.lineup as object[])[0]!).sort()).toEqual(Object.keys(stored.lineup[0]!).sort())
    errors.mockRestore()
  })
})
