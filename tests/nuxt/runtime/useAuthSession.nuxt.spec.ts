import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createError } from 'h3'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useAuthSession } from '../../../layers/auth/app/composables/auth/useAuthSession'

mockNuxtImport('useAppConfig', () => {
  return () => ({
    authIntegration: {
      drupalAccounts: true,
    },
    colorMode: {
      forced: false,
      preference: 'system',
      showToggle: true,
      lightRoutes: [],
      darkRoutes: [],
    },
    ui: {
      colors: {
        neutral: 'slate',
        primary: 'green',
      },
      prefix: 'ui',
    },
    icon: {
      provider: 'local',
    },
  })
})

describe('useAuthSession', () => {
  let sessionCalls = 0
  let unregisterEndpoint: (() => void) | undefined

  beforeEach(() => {
    sessionCalls = 0
    unregisterEndpoint = registerEndpoint('/api/auth/session', () => {
      sessionCalls++

      return {
        authenticated: true,
        protectedAuthenticated: false,
        user: { roles: ['authenticated'] },
      }
    })
  })

  afterEach(() => {
    unregisterEndpoint?.()
    unregisterEndpoint = undefined
  })

  it('reuses a resolved session unless explicitly refreshed', async () => {
    const SessionHarness = defineComponent({
      setup() {
        return {
          fetchSession: useAuthSession().fetchSession,
        }
      },
      template: '<div />',
    })

    const wrapper = await mountSuspended(SessionHarness)
    const session = wrapper.vm as { fetchSession: (options?: { force?: boolean }) => Promise<void> }

    await session.fetchSession()
    await session.fetchSession()

    expect(sessionCalls).toBe(1)

    await session.fetchSession({ force: true })

    expect(sessionCalls).toBe(2)
    wrapper.unmount()
  })

  it('deduplicates concurrent session reads', async () => {
    const SessionHarness = defineComponent({
      setup() {
        return {
          first: useAuthSession().fetchSession,
          second: useAuthSession().fetchSession,
        }
      },
      template: '<div />',
    })

    const wrapper = await mountSuspended(SessionHarness)
    const session = wrapper.vm as {
      first: (options?: { force?: boolean }) => Promise<void>
      second: (options?: { force?: boolean }) => Promise<void>
    }

    await Promise.all([
      session.first({ force: true }),
      session.second({ force: true }),
    ])

    expect(sessionCalls).toBe(1)
    wrapper.unmount()
  })

  it('propagates a failed forced refresh', async () => {
    const SessionHarness = defineComponent({
      setup() {
        return {
          fetchSession: useAuthSession().fetchSession,
        }
      },
      template: '<div />',
    })

    const wrapper = await mountSuspended(SessionHarness)
    const session = wrapper.vm as {
      fetchSession: (options?: { force?: boolean }) => Promise<void>
    }

    unregisterEndpoint?.()
    unregisterEndpoint = registerEndpoint('/api/auth/session', () => {
      throw createError({ statusCode: 502, statusMessage: 'Drupal unavailable' })
    })

    await expect(session.fetchSession({ force: true })).rejects.toMatchObject({
      statusCode: 502,
    })
    wrapper.unmount()
  })
})
