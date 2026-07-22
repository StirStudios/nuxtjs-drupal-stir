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
  imageResolver: vi.fn((source: string) => `/_ipx/test/${source}`),
}))

mockNuxtImport('useAppConfig', () => () => state.appConfig)
mockNuxtImport('useAuthConfig', () => () => ({ auth: ref(state.auth) }))
mockNuxtImport('useImage', () => () => state.imageResolver)

describe('AuthPage', () => {
  beforeEach(async () => {
    state.auth = {}
    state.imageResolver.mockClear()
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

    const imagePanel = wrapper.find('[aria-hidden="true"]')

    expect(imagePanel.attributes('style')).toContain('/_ipx/')
    expect(imagePanel.attributes('style')).toContain('https://example.com/global-auth.jpg')
    expect(state.imageResolver).toHaveBeenCalledWith(
      'https://example.com/global-auth.jpg',
      {
        width: 1920,
        quality: 80,
        format: 'webp',
      },
    )
    wrapper.unmount()
  })

  it('renders the default semantic auth canvas without project overrides', async () => {
    state.appConfig.stirTheme = { auth: {} }

    const wrapper = await mountSuspended(AuthPage, {
      slots: {
        default: '<div>Auth form</div>',
      },
    })

    const canvas = wrapper.find('[role="presentation"]')

    expect(canvas.classes()).toContain('bg-muted/50')
    expect(canvas.findAll('[aria-hidden="true"]')).toHaveLength(2)
    wrapper.unmount()
  })

  it('allows the auth theme to replace the canvas and disable decoration', async () => {
    state.appConfig.stirTheme = {
      auth: {
        backgroundClass: 'bg-elevated',
        showBackgroundDecoration: false,
      },
    }

    const wrapper = await mountSuspended(AuthPage, {
      slots: {
        default: '<div>Auth form</div>',
      },
    })

    const canvas = wrapper.find('[role="presentation"]')

    expect(canvas.classes()).toContain('bg-elevated')
    expect(canvas.findAll('[aria-hidden="true"]')).toHaveLength(0)
    wrapper.unmount()
  })
})
