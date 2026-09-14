import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#app'
import { flushPromises } from '@vue/test-utils'
import { readBody } from 'h3'
import { defineComponent, h, type Component } from 'vue'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import AuthRegister from '../../../layers/auth/app/components/Auth/AuthRegister.vue'
import RegisterPage from '../../../layers/auth/app/pages/auth/register.vue'
import {
  useAuthRegister,
  type StirAuthRegisterOptions,
} from '../../../layers/auth/app/composables/auth/useAuthRegister'

type ExtraState = { first_name: string, newsletter: boolean }

const submitEvent = {
  data: { email: ' demo@example.com ', password: 'Secret-Password-1' },
} as FormSubmitEvent<{ email: string, password: string }>

let requests: Record<string, unknown>[] = []
let registerResponse: Record<string, unknown> = { created: true }

/**
 * Runs the composable in a component and submits the given credentials.
 */
async function submitWith<T extends Record<string, unknown>>(
  options?: StirAuthRegisterOptions<T>,
  prepare?: (register: ReturnType<typeof useAuthRegister<T>>) => void,
) {
  let register: ReturnType<typeof useAuthRegister<T>> | undefined

  const Harness = defineComponent({
    setup() {
      register = useAuthRegister(options)

      return () => null
    },
  })

  const wrapper = await mountSuspended(Harness)

  prepare?.(register!)
  await register!.onSubmit(submitEvent)
  wrapper.unmount()

  return register!
}

describe('useAuthRegister', () => {
  let unregister: Array<() => void> = []

  beforeEach(() => {
    requests = []
    registerResponse = { created: true }
    clearNuxtData('stir-auth-ui-config')
    unregister = [
      registerEndpoint('/api/auth/config', () => ({ version: 2, accountsEnabled: true })),
      registerEndpoint('/api/auth/register', {
        method: 'POST',
        handler: async (event) => {
          requests.push(await readBody(event))

          return registerResponse
        },
      }),
    ]
  })

  afterEach(() => {
    for (const remove of unregister) remove()
    unregister = []
    clearNuxtData('stir-auth-ui-config')
  })

  it('sends the original payload when called without options', async () => {
    await submitWith(undefined, (register) => {
      register.turnstileToken.value = 'turnstile-token'
    })

    expect(requests).toEqual([{
      email: 'demo@example.com',
      password: 'Secret-Password-1',
      turnstile_response: 'turnstile-token',
    }])
  })

  it('sends extra state as fields alongside the Turnstile token', async () => {
    await submitWith<ExtraState>(
      { initialState: { first_name: '', newsletter: false } },
      (register) => {
        register.state.first_name = 'Ada'
        register.state.newsletter = true
        register.turnstileToken.value = 'turnstile-token'
      },
    )

    expect(requests).toEqual([{
      email: 'demo@example.com',
      password: 'Secret-Password-1',
      turnstile_response: 'turnstile-token',
      fields: { first_name: 'Ada', newsletter: true },
    }])
  })

  it('maps state through toFields', async () => {
    await submitWith<ExtraState>(
      {
        initialState: { first_name: '  Ada ', newsletter: true },
        toFields: state => ({ first_name: state.first_name.trim() }),
      },
    )

    expect(requests[0]?.fields).toEqual({ first_name: 'Ada' })
  })

  it('does not share initial state between instances', async () => {
    const initialState = { first_name: '', newsletter: false }
    const register = await submitWith<ExtraState>({ initialState }, (instance) => {
      instance.state.first_name = 'Ada'
    })

    expect(register.state.first_name).toBe('Ada')
    expect(initialState.first_name).toBe('')
  })

  it('merges extra validation with the credential errors', async () => {
    const register = await submitWith<ExtraState>({
      initialState: { first_name: '', newsletter: false },
      validate: (state): FormError[] =>
        state.first_name ? [] : [{ name: 'first_name', message: 'First name is required' }],
    })

    expect(register.validate({ email: '', password: '' }).map(error => error.name))
      .toEqual(expect.arrayContaining(['email', 'password', 'first_name']))
  })

  it('keeps the approval-required state', async () => {
    registerResponse = { created: true, approval_required: true }

    const register = await submitWith()

    expect(register.registrationComplete.value).toBe(true)
    expect(register.requiresApproval.value).toBe(true)
    expect(register.registrationMessage.value).toContain('awaiting administrator approval')
  })
})

describe('AuthRegister', () => {
  let unregister: Array<() => void> = []

  beforeEach(() => {
    requests = []
    registerResponse = { created: true }
    clearNuxtData('stir-auth-ui-config')
    unregister = [
      registerEndpoint('/api/auth/config', () => ({ version: 2, accountsEnabled: true })),
      registerEndpoint('/api/auth/register', {
        method: 'POST',
        handler: async (event) => {
          requests.push(await readBody(event))

          return registerResponse
        },
      }),
    ]
  })

  afterEach(() => {
    for (const remove of unregister) remove()
    unregister = []
    clearNuxtData('stir-auth-ui-config')
  })

  const fill = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>) => {
    await wrapper.find('input[name="email"]').setValue('demo@example.com')
    await wrapper.find('input[name="password"]').setValue('Secret-Password-1')
  }

  it('renders the default page with only email and password', async () => {
    const wrapper = await mountSuspended(RegisterPage)

    expect(wrapper.findAll('input[name]').map(input => input.attributes('name')))
      .toEqual(['email', 'password'])
    expect(wrapper.text()).toContain('Already have an account?')
    wrapper.unmount()
  })

  it('renders slot fields with labels and errors, and sends their values', async () => {
    const wrapper = await mountSuspended(AuthRegister, {
      props: {
        options: {
          initialState: { first_name: '' },
          validate: (state: Record<string, unknown>): FormError[] =>
            state.first_name ? [] : [{ name: 'first_name', message: 'First name is required' }],
        },
      },
      slots: {
        fields: ({ state }: { state: Record<string, unknown> }) => h(
          UFormField,
          { label: 'First name', name: 'first_name', required: true },
          () => h(UInput as Component, {
            'modelValue': state.first_name,
            'onUpdate:modelValue': (value: string) => { state.first_name = value },
          }),
        ),
      },
    })

    await fill(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const input = wrapper.find('input:not([name="email"]):not([name="password"])')
    const label = wrapper.findAll('label').find(node => node.text().includes('First name'))

    expect(label?.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('First name is required')
    expect(requests).toEqual([])

    await input.setValue('Ada')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      email: 'demo@example.com',
      fields: { first_name: 'Ada' },
    })
    wrapper.unmount()
  })

  it('shows the approval-required state after a slotted signup', async () => {
    registerResponse = { created: true, approval_required: true }

    const wrapper = await mountSuspended(AuthRegister, {
      props: { options: { initialState: { newsletter: true } } },
      slots: { fields: () => h('p', 'Newsletter opt-in') },
    })

    expect(wrapper.text()).toContain('Newsletter opt-in')
    await fill(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(requests[0]?.fields).toEqual({ newsletter: true })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Account awaiting approval')
    })
    expect(wrapper.find('form').exists()).toBe(false)
    wrapper.unmount()
  })
})
