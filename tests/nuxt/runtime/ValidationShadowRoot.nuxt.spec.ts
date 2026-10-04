import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import { UForm, UFormField, UInput } from '#components'
import type { FormErrorEvent } from '@nuxt/ui'
import { useValidation } from '../../../layers/foundation/app/composables/useValidation'

describe('useValidation', () => {
  it('focuses the invalid field first on the page, however Nuxt UI orders the errors', async () => {
    const TwoFieldForm = defineComponent({
      setup() {
        const { onError } = useValidation({ showToast: false })
        const state = reactive({})
        // Reported bottom field first, as Nuxt UI may list them.
        const validate = () => [
          { name: 'email', message: 'Required' },
          { name: 'guests', message: 'Required' },
        ]

        return () => h(UForm, { state, validate, onError }, () => [
          h(UFormField, { name: 'guests', label: 'Guests' }, () => h(UInput)),
          h(UFormField, { name: 'email', label: 'Email' }, () => h(UInput)),
        ])
      },
    })

    const wrapper = await mountSuspended(TwoFieldForm, { attachTo: document.body })
    const [guests] = wrapper.findAll('input')

    await wrapper.get('form').trigger('submit')

    await vi.waitFor(() => expect(document.activeElement).toBe(guests!.element))
    wrapper.unmount()
  })

  it('focuses the first invalid field once Nuxt UI enables it again', async () => {
    const SignupForm = defineComponent({
      setup() {
        const { onError } = useValidation({ showToast: false })
        const state = reactive({ name: '' })
        const validate = () => state.name ? [] : [{ name: 'name', message: 'Required' }]

        // The field stays empty, so validation fails.
        return () => h(UForm, { state, validate, onError }, () =>
          h(UFormField, { name: 'name', label: 'Name' }, () => h(UInput)))
      },
    })

    const wrapper = await mountSuspended(SignupForm, { attachTo: document.body })
    const field = wrapper.get('input').element

    await wrapper.get('form').trigger('submit')

    await vi.waitFor(() => expect(document.activeElement).toBe(field))
    wrapper.unmount()
  })

  it('focuses and scrolls to the first invalid field document cannot see', async () => {
    const host = document.createElement('div')

    document.body.append(host)
    const shadow = host.attachShadow({ mode: 'open' })
    const mountPoint = document.createElement('div')

    shadow.append(mountPoint)

    let onError: ((event: FormErrorEvent) => void) | undefined
    const EmbeddedForm = defineComponent({
      setup() {
        ;({ onError } = useValidation({ showToast: false }))

        return () => h('input', { id: 'guest-count' })
      },
    })

    const wrapper = await mountSuspended(EmbeddedForm)

    // Embedded, the form is rendered inside the widget's shadow root.
    shadow.append(wrapper.element)
    const field = shadow.getElementById('guest-count') as HTMLInputElement
    const scrollIntoView = vi.fn()

    field.scrollIntoView = scrollIntoView
    // Far down the page, off screen.
    field.getBoundingClientRect = () => ({ top: 3000, bottom: 3040 }) as DOMRect

    expect(document.getElementById('guest-count')).toBeNull()

    onError!({ errors: [{ id: 'guest-count', name: 'guest_count', message: 'Required' }] } as unknown as FormErrorEvent)

    await vi.waitFor(() => expect(shadow.activeElement).toBe(field))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })

    wrapper.unmount()
    host.remove()
  })
})
