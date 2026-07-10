import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useRouter } from '#app'
import { ref } from 'vue'
import AuthPage from '../../../layers/auth/app/components/Auth/AuthPage.vue'

const state = vi.hoisted(() => ({
  appConfig: {
    colorMode: {
      forced: false,
      preference: 'system',
      showToggle: true,
      lightRoutes: [],
      darkRoutes: [],
    },
    icon: {
      provider: 'local',
    },
    stirTheme: {},
    ui: {
      colors: {
        neutral: 'slate',
        primary: 'green',
      },
      prefix: 'ui',
    },
  } as Record<string, unknown>,
  auth: {} as Record<string, unknown>,
}))

mockNuxtImport('useAppConfig', () => () => state.appConfig)
mockNuxtImport('useAuthConfig', () => () => ({ auth: ref(state.auth) }))

describe('AuthPage', () => {
  beforeEach(async () => {
    state.auth = {}
    state.appConfig = {
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
      stirTheme: {
        auth: {
          backgroundImage: 'https://example.com/global-auth.jpg',
          layout: 'page-split',
        },
      },
    }

    await useRouter().replace('/auth/login')
  })

  it('uses the configured global auth theme layout', async () => {
    const wrapper = await mountSuspended(AuthPage, {
      slots: {
        default: '<div>Auth form</div>',
      },
    })

    expect(wrapper.find('.grid').exists()).toBe(true)
    wrapper.unmount()
  })
})
