import { afterEach, describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent, nextTick } from 'vue'
import { useAuthSession } from '../../../layers/auth/app/composables/auth/useAuthSession'

mockNuxtImport('useAppConfig', () => {
  return () => ({
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

describe('signed-out notice', () => {
  let unregisterEndpoint: (() => void) | undefined

  afterEach(() => {
    unregisterEndpoint?.()
    unregisterEndpoint = undefined
  })

  it('tells a member once that another device signed them out', async () => {
    unregisterEndpoint = registerEndpoint('/api/auth/session', () => ({
      authenticated: false,
      protectedAuthenticated: false,
      user: null,
      signedOutReason: 'session_limit',
    }))

    const SessionHarness = defineComponent({
      setup() {
        const session = useAuthSession()

        return {
          fetchSession: session.fetchSession,
          signedOutReason: session.signedOutReason,
          toasts: useToast().toasts,
        }
      },
      template: '<div />',
    })
    const wrapper = await mountSuspended(SessionHarness)
    const harness = wrapper.vm as {
      fetchSession: (options?: { force?: boolean }) => Promise<void>
      signedOutReason: string | null
      toasts: Array<{ title?: string, description?: string }>
    }

    await harness.fetchSession({ force: true })
    await nextTick()

    const notices = harness.toasts.filter(toast => toast.description?.includes('another device'))

    expect(notices).toHaveLength(1)
    expect(harness.signedOutReason, 'shown once, then cleared').toBeNull()
  })
})
