import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from '#app'
import { defineComponent, nextTick, type Ref } from 'vue'
import { createError, readBody } from 'h3'
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  useAuthLogin,
  type StirAuthLoginOptions,
  type StirAuthLoginRedirectContext,
} from '../../../layers/auth/app/composables/useAuthLogin'

const navigateToMock = vi.fn()
let currentQuery: Record<string, unknown> = {}

vi.mock('#app/composables/router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#app/composables/router')>()),
  navigateTo: (...args: unknown[]) => navigateToMock(...args),
  useRoute: () => ({ query: currentQuery }),
}))

const submitEvent = {
  data: { identifier: 'demo@example.com', password: 'secret' },
} as FormSubmitEvent<{ identifier: string, password: string }>

/**
 * Signs in through the composable and returns what it navigated to.
 */
async function signIn(options?: StirAuthLoginOptions): Promise<unknown[]> {
  let submit: ((event: typeof submitEvent) => Promise<void>) | undefined

  const LoginHarness = defineComponent({
    setup() {
      submit = useAuthLogin(options).onSubmit

      return () => null
    },
  })

  const wrapper = await mountSuspended(LoginHarness)

  await submit?.(submitEvent)
  wrapper.unmount()

  return navigateToMock.mock.calls.map(call => call[0])
}

describe('useAuthLogin post-login destination', () => {
  let unregister: Array<() => void> = []

  beforeEach(() => {
    navigateToMock.mockReset()
    currentQuery = {}
    clearNuxtData('stir-auth-ui-config')
    unregister = [
      registerEndpoint('/api/auth/config', () => ({
        version: 2,
        accountsEnabled: true,
        loginRedirectPath: '/account',
      })),
      registerEndpoint('/api/auth/login', () => ({
        session: { authenticated: true },
      })),
      registerEndpoint('/api/auth/session', () => ({
        authenticated: true,
        user: { uid: 1, name: 'demo' },
      })),
    ]
  })

  afterEach(() => {
    for (const remove of unregister) remove()
    unregister = []
    clearNuxtData('stir-auth-ui-config')
  })

  it('uses the configured default when no redirect is requested', async () => {
    expect(await signIn()).toEqual(['/account'])
  })

  it('prefers a same-site redirect from the query', async () => {
    currentQuery = { redirect: '/account/settings' }

    expect(await signIn()).toEqual(['/account/settings'])
  })

  it('ignores an off-site redirect and uses the default', async () => {
    // A protocol-relative target would leave the site entirely.
    currentQuery = { redirect: '//evil.com' }

    expect(await signIn()).toEqual(['/account'])
  })

  it('lets a caller compute the destination', async () => {
    currentQuery = { redirect: '/gift/redeem/abc' }

    const seen: StirAuthLoginRedirectContext[] = []
    const destinations = await signIn({
      redirectTo: (context) => {
        seen.push(context)

        return context.redirect ?? '/dashboard'
      },
    })

    expect(destinations).toEqual(['/gift/redeem/abc'])
    expect(seen).toEqual([{ redirect: '/gift/redeem/abc', fallback: '/account' }])
  })

  it('hands the caller a context without an unsafe redirect', async () => {
    currentQuery = { redirect: '//evil.com' }

    const seen: StirAuthLoginRedirectContext[] = []

    await signIn({
      redirectTo: (context) => {
        seen.push(context)

        return context.redirect ?? '/dashboard'
      },
    })

    expect(seen).toEqual([{ redirect: undefined, fallback: '/account' }])
  })

  it('awaits an asynchronous destination', async () => {
    const destinations = await signIn({
      redirectTo: async () => {
        await new Promise(resolve => setTimeout(resolve, 5))

        return '/onboarding/training'
      },
    })

    expect(destinations).toEqual(['/onboarding/training'])
  })

  it('navigates nowhere when the caller returns false', async () => {
    expect(await signIn({ redirectTo: () => false })).toEqual([])
  })
})

describe('useAuthLogin Turnstile token', () => {
  let unregister: Array<() => void> = []

  beforeEach(() => {
    clearNuxtData('stir-auth-ui-config')
    unregister = [
      registerEndpoint('/api/auth/config', () => ({
        version: 2,
        accountsEnabled: true,
      })),
      registerEndpoint('/api/auth/login', () => {
        throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
      }),
    ]
  })

  afterEach(() => {
    for (const remove of unregister) remove()
    unregister = []
    clearNuxtData('stir-auth-ui-config')
  })

  it('discards the spent token after a failed attempt', async () => {
    let login: ReturnType<typeof useAuthLogin> | undefined

    const LoginHarness = defineComponent({
      setup() {
        login = useAuthLogin()

        return () => null
      },
    })

    const wrapper = await mountSuspended(LoginHarness)

    login!.turnstileToken.value = 'spent-token'
    await login!.onSubmit(submitEvent)

    expect(login!.turnstileToken.value).toBe('')
    wrapper.unmount()
  })
})

describe('useAuthLogin failures', () => {
  let unregister: Array<() => void> = []
  let resendBodies: unknown[] = []

  /**
   * Mounts the composable, submits once and returns it with the toasts shown.
   */
  async function failSignIn(options?: StirAuthLoginOptions) {
    let login: ReturnType<typeof useAuthLogin> | undefined
    let toasts: Ref<Array<Record<string, unknown>>> | undefined

    const LoginHarness = defineComponent({
      setup() {
        login = useAuthLogin(options)
        toasts = useState('toasts')

        return () => null
      },
    })

    const wrapper = await mountSuspended(LoginHarness)

    toasts!.value = []
    await login!.onSubmit(submitEvent)
    await nextTick()
    await nextTick()

    return { login: login!, toasts: toasts!, wrapper }
  }

  const rejectLogin = (statusCode: number, message: string, code?: string) => {
    unregister.push(registerEndpoint('/api/auth/login', () => {
      throw createError({
        statusCode,
        statusMessage: message,
        ...(code ? { data: { code } } : {}),
      })
    }))
  }

  beforeEach(() => {
    resendBodies = []
    clearNuxtData('stir-auth-ui-config')
    unregister = [
      registerEndpoint('/api/auth/config', () => ({
        version: 2,
        accountsEnabled: true,
      })),
      registerEndpoint('/api/auth/verify/resend', {
        method: 'POST',
        handler: async (event) => {
          resendBodies.push(await readBody(event))

          return { accepted: true }
        },
      }),
    ]
  })

  afterEach(() => {
    for (const remove of unregister) remove()
    unregister = []
    clearNuxtData('stir-auth-ui-config')
  })

  it('shows Drupal\'s message once, under a distinct title', async () => {
    rejectLogin(401, 'The email or password is incorrect.', 'invalid_credentials')

    const { login, toasts, wrapper } = await failSignIn()

    expect(login.error.value).toEqual({
      title: 'Couldn\'t sign you in',
      message: 'The email or password is incorrect.',
      code: 'invalid_credentials',
    })
    expect(login.errorActions.value).toEqual([])
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({
      title: 'Couldn\'t sign you in',
      description: 'The email or password is incorrect.',
      color: 'error',
    })
    wrapper.unmount()
  })

  it('offers to resend the verification email', async () => {
    rejectLogin(
      403,
      'Please verify your email address before signing in.',
      'verification_required',
    )

    const { login, toasts, wrapper } = await failSignIn()
    const [action] = login.errorActions.value

    expect(action?.label).toBe('Resend verification email')
    expect((toasts.value[0]?.actions as unknown[])).toHaveLength(1)

    await login.resendVerification()
    await nextTick()

    expect(resendBodies).toEqual([{ identifier: 'demo@example.com' }])
    expect(toasts.value.at(-1)).toMatchObject({
      description:
        'If that address has an account waiting for verification, we\'ve sent a new link.',
      color: 'success',
    })
    wrapper.unmount()
  })

  it('leaves the failure to the page when toasts are off', async () => {
    rejectLogin(401, 'The email or password is incorrect.')

    const { login, toasts, wrapper } = await failSignIn({ toastErrors: false })

    expect(login.error.value?.message).toBe('The email or password is incorrect.')
    expect(login.error.value?.code).toBe('')
    expect(toasts.value).toEqual([])
    wrapper.unmount()
  })
})
