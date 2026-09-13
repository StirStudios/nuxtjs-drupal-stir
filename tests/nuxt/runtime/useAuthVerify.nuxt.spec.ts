import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#app'
import { defineComponent } from 'vue'
import {
  type StirAuthVerifyOptions,
  useAuthVerify,
} from '../../../layers/auth/app/composables/auth/useAuthVerify'

const navigateToMock = vi.fn()
const verifyEndpoint = vi.fn(() => ({ verified: true }))
let currentQuery: Record<string, unknown> = {}

vi.mock('#app/composables/router', async importOriginal => ({
  ...(await importOriginal<typeof import('#app/composables/router')>()),
  navigateTo: (...args: unknown[]) => navigateToMock(...args),
  useRoute: () => ({ query: currentQuery }),
}))

const validLink = { uid: '7', timestamp: '1700000000', token: 'abc' }
const wrappers: Array<{ unmount: () => void }> = []

const mountVerify = async (options?: StirAuthVerifyOptions) => {
  let verify: ReturnType<typeof useAuthVerify> | undefined
  const Harness = defineComponent({
    setup() {
      verify = useAuthVerify(options)

      return () => null
    },
  })

  wrappers.push(await mountSuspended(Harness))

  if (!verify) throw new Error('Verify composable was not initialized.')

  return verify
}

describe('useAuthVerify', () => {
  let unregister: Array<() => void> = []

  beforeEach(() => {
    navigateToMock.mockReset()
    verifyEndpoint.mockClear()
    currentQuery = {}
    clearNuxtData('stir-auth-ui-config')
    unregister = [
      registerEndpoint('/api/auth/config', () => ({ version: 2, accountsEnabled: true })),
      registerEndpoint('/api/auth/verify', { method: 'POST', handler: verifyEndpoint }),
    ]
  })

  afterEach(() => {
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    unregister.forEach(fn => fn())
  })

  it('links to plain sign-in when there is no redirect', async () => {
    currentQuery = { ...validLink }

    const { loginTarget } = await mountVerify()

    expect(loginTarget.value).toEqual({ path: '/auth/login' })
  })

  it('carries a safe same-site redirect to sign-in after verifying', async () => {
    currentQuery = { ...validLink, redirect: '/gift/redeem?token=xyz' }

    const { loginTarget, verified, verify } = await mountVerify()

    expect(loginTarget.value).toEqual({
      path: '/auth/login',
      query: { redirect: '/gift/redeem?token=xyz' },
    })

    await verify()

    expect(verifyEndpoint).toHaveBeenCalledOnce()
    expect(verified.value).toBe(true)
    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/auth/login',
      query: { redirect: '/gift/redeem?token=xyz' },
    })
  })

  it.each([
    '//evil.example',
    '/\\evil.example',
    'https://evil.example/account',
    'http://evil.example',
    'javascript:alert(1)',
    'account',
    '',
  ])('drops the unsafe redirect %s', async (redirect) => {
    currentQuery = { ...validLink, redirect }

    const { loginTarget } = await mountVerify()

    expect(loginTarget.value).toEqual({ path: '/auth/login' })
  })

  it('ignores a repeated redirect parameter', async () => {
    currentQuery = { ...validLink, redirect: ['/a', '/b'] }

    const { loginTarget } = await mountVerify()

    expect(loginTarget.value).toEqual({ path: '/auth/login' })
  })

  it('does not round-trip sign-in into itself', async () => {
    currentQuery = { ...validLink, redirect: '/auth/login?x=1' }

    const { loginTarget } = await mountVerify()

    expect(loginTarget.value).toEqual({ path: '/auth/login' })
  })

  it('uses the fallback only when the query has no usable redirect', async () => {
    const fallbackRedirect = () => '/gift/redeem?token=remembered'

    currentQuery = { ...validLink }
    expect((await mountVerify({ fallbackRedirect })).loginTarget.value).toEqual({
      path: '/auth/login',
      query: { redirect: '/gift/redeem?token=remembered' },
    })

    currentQuery = { ...validLink, redirect: '//evil.example' }
    expect((await mountVerify({ fallbackRedirect })).loginTarget.value).toEqual({
      path: '/auth/login',
      query: { redirect: '/gift/redeem?token=remembered' },
    })

    currentQuery = { ...validLink, redirect: '/pricing' }
    expect((await mountVerify({ fallbackRedirect })).loginTarget.value).toEqual({
      path: '/auth/login',
      query: { redirect: '/pricing' },
    })
  })

  it.each(['https://evil.example', '//evil.example', null])(
    'holds the fallback %s to the same-site rule',
    async (fallbackRedirect) => {
      currentQuery = { ...validLink }

      const { loginTarget } = await mountVerify({ fallbackRedirect })

      expect(loginTarget.value).toEqual({ path: '/auth/login' })
    },
  )

  it('does not call Drupal or navigate for an incomplete link', async () => {
    currentQuery = { uid: '7', redirect: '/pricing' }

    const { isLoading, message, verified, verify } = await mountVerify()

    await verify()

    expect(verifyEndpoint).not.toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(isLoading.value).toBe(false)
    expect(verified.value).toBe(false)
    expect(message.value).toBe('Verification link is invalid or incomplete.')
  })
})
