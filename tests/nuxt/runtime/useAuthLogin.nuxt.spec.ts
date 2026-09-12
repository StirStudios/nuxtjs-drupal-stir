import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#app'
import { defineComponent } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  useAuthLogin,
  type StirAuthLoginOptions,
  type StirAuthLoginRedirectContext,
} from '../../../layers/auth/app/composables/auth/useAuthLogin'

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
