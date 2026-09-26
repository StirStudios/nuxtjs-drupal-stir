import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useRouter } from '#app'
import { ref } from 'vue'
import AuthPage from '../../../layers/auth/app/components/Auth/AuthPage.vue'
import DefaultLayout from '../../../layers/theme/app/layouts/default.vue'

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
mockNuxtImport('useAuthConfig', () => () => ({
  auth: ref(state.auth),
  accountsEnabled: computed(() => typeof state.auth.version === 'number' && state.auth.accountsEnabled !== false),
  status: ref('success'),
  ensureLoaded: async () => {},
}))
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
    const main = wrapper.find('main')

    expect(canvas.classes()).toContain('bg-muted/50')
    expect(canvas.findAll('[aria-hidden="true"]')).toHaveLength(2)
    expect(main.attributes()).toMatchObject({
      id: 'main-content',
      role: 'main',
      tabindex: '-1',
    })
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

  describe('site chrome', () => {
    // Records what AuthPage asks of the site layout.
    const NuxtLayout = {
      props: ['name', 'footer'],
      template: '<div data-test-layout :data-name="String(name)" :data-footer="String(footer)"><slot /></div>',
    }
    const mountAuth = () => mountSuspended(AuthPage, {
      slots: { default: '<div>Auth form</div>' },
      global: { stubs: { NuxtLayout } },
    })

    it.each([
      [undefined, 'false', false],
      ['none', 'false', false],
      ['header', 'default', false],
      ['full', 'default', true],
    ])('renders chrome %s in the %s layout', async (chrome, name, footer) => {
      state.appConfig.stirTheme = { auth: { chrome } }

      const wrapper = await mountAuth()
      const layout = wrapper.get('[data-test-layout]')

      expect(layout.attributes('data-name')).toBe(name)
      expect(layout.attributes('data-footer')).toBe(String(footer))
      // The site layout owns <main>, so the auth content never nests one.
      expect(wrapper.find('main').exists()).toBe(name === 'false')
      wrapper.unmount()
    })

    it('fills the viewport under a fixed header and marks a full-bleed background', async () => {
      state.appConfig.stirTheme = {
        auth: { chrome: 'header', layout: 'card', backgroundImage: 'https://example.com/gate.jpg' },
      }

      const wrapper = await mountAuth()
      const canvas = wrapper.get('[role="presentation"]')

      expect(canvas.classes()).toEqual(expect.arrayContaining(['min-h-dvh', 'auth-background']))
      wrapper.unmount()
    })

    it('leaves room for a sticky header', async () => {
      state.appConfig.stirTheme = {
        auth: { chrome: 'header' },
        navigation: { mode: 'sticky' },
      }

      const wrapper = await mountAuth()

      expect(wrapper.get('[role="presentation"]').classes())
        .toContain('min-h-[calc(100dvh-var(--ui-header-height))]')
      wrapper.unmount()
    })

    it('lets the default layout drop its footer', async () => {
      state.appConfig.stirTheme = { routeHero: { enabled: false }, navigation: { mode: 'fixed' } }
      const stubs = { AppHeader: true, SiteMessages: true, AppFooter: { template: '<footer data-test-footer />' }, LazyAppFooter: { template: '<footer data-test-footer />' } }

      const withFooter = await mountSuspended(DefaultLayout, { global: { stubs } })
      const withoutFooter = await mountSuspended(DefaultLayout, { props: { footer: false }, global: { stubs } })

      expect(withFooter.find('[data-test-footer]').exists()).toBe(true)
      expect(withoutFooter.find('[data-test-footer]').exists()).toBe(false)
      withFooter.unmount()
      withoutFooter.unmount()
    })
  })
})
