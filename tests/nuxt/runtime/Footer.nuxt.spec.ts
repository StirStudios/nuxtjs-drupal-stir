import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import Footer from '../../../layers/theme/app/components/App/Footer.vue'

const page = ref({} as Record<string, unknown>)
const appFooterContextData = ref({
  footer_menu: [
    { title: 'Accessibility Statement', url: '/accessibility-statement' },
    { title: 'Privacy Policy', url: '/privacy-policy' },
  ],
  site_info: {
    name: 'Santa Barbara Public Market Dev',
    mail: 'info@sbpublicmarket.com',
    slogan: 'Fine food and wine',
  },
})
const appConfig = ref({
  stirTheme: {
    container: 'max-w-(--ui-container) mx-auto px-4 md:px-5 lg:px-8',
    footer: {
      showSubFooterRegion: false,
      showFooterRegion: false,
      content: 'flex flex-col gap-6',
    },
    navigation: {
      logo: true,
    },
    socials: [
      {
        url: 'https://x.com',
        title: 'X',
      },
    ],
  },
  colorMode: {
    forced: false,
    showToggle: true,
    preference: 'dark',
  },
  icon: {
    provider: 'none',
  },
  ui: {
    colors: {
      neutral: 'slate',
      primary: 'green',
    },
    prefix: 'ui',
  },
})
let appFooterContextExecuteCalls = 0

mockNuxtImport('useAppConfig', () => {
  return () => appConfig.value
})

mockNuxtImport('useDrupalCe', () => {
  return () => ({
    getPage: () => page,
  })
})

mockNuxtImport('useAppFooterContext', () => {
  return () => ({
    data: appFooterContextData,
    execute: () => {
      appFooterContextExecuteCalls += 1
    },
  })
})

mockNuxtImport('useSocialIcons', () => {
  return () => ({
    iconsSocialConfig: appConfig.value.stirTheme.socials,
  })
})

const footerStubs = {
  UFooter: {
    props: ['ui'],
    template:
      '<footer><div data-slot="container" :class="ui.container"><div data-slot="left" :class="ui.left"><slot name="left" /></div><div data-slot="center" :class="ui.center"><slot /></div><div data-slot="right" :class="ui.right"><slot name="right" /></div></div></footer>',
  },
  LazyRegionArea: {
    props: ['area'],
    template: '<div :data-area="area" />',
  },
  LazyAppLogo: {
    template: '<div class="app-logo" />',
  },
  LazyUNavigationMenu: {
    props: ['items'],
    template:
      '<nav><ul><li v-for="item in items" :key="item.to">{{ item.label }}</li></ul></nav>',
  },
  LazyIconsSocial: {
    props: ['url', 'title'],
    template: '<a :href="url">{{ title }}</a>',
  },
  ULink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}

const mountFooter = async () => {
  return mountSuspended(Footer, {
    global: {
      stubs: footerStubs,
    },
  })
}

describe('Footer (Nuxt runtime)', () => {
  it('renders footer sections with centered layout classes', async () => {
    page.value = {}
    appFooterContextExecuteCalls = 0

    const wrapper = await mountFooter()

    const centerSection = wrapper.find('[data-slot="center"] > div')

    expect(appFooterContextExecuteCalls).toBe(1)
    expect(centerSection.classes()).toContain('flex')
    expect(centerSection.classes()).toContain('flex-col')
    expect(centerSection.classes()).not.toContain('grid')
    expect(wrapper.text()).toContain('Accessibility Statement')
    expect(wrapper.text()).toContain('info@sbpublicmarket.com')
  })

  it('uses app context fallback when page footer_menu or site_info are missing', async () => {
    page.value = {}
    appFooterContextExecuteCalls = 0

    const wrapper = await mountFooter()

    expect(wrapper.text()).toContain('Santa Barbara Public Market Dev')
    expect(wrapper.text()).toContain('info@sbpublicmarket.com')
    expect(appFooterContextExecuteCalls).toBe(1)
  })

  it('uses the app context menu when a Nuxt-only page supplies an empty menu', async () => {
    page.value = {
      footer_menu: [],
      site_info: {
        name: 'Nuxt page',
      },
    }
    appFooterContextExecuteCalls = 0

    const wrapper = await mountFooter()

    expect(wrapper.text()).toContain('Accessibility Statement')
    expect(wrapper.text()).toContain('Privacy Policy')
    expect(appFooterContextExecuteCalls).toBe(1)
  })

  it('applies responsive ordering to the Nuxt UI section wrappers', async () => {
    page.value = {}
    appConfig.value.stirTheme.footer.leftSlot = 'order-2 lg:order-1'
    appConfig.value.stirTheme.footer.centerSlot = 'order-3 lg:order-2'
    appConfig.value.stirTheme.footer.rightSlot = 'order-1 lg:order-3'

    const wrapper = await mountFooter()

    expect(wrapper.find('[data-slot="left"]').classes()).toEqual(expect.arrayContaining(['order-2', 'lg:order-1']))
    expect(wrapper.find('[data-slot="center"]').classes()).toEqual(expect.arrayContaining(['order-3', 'lg:order-2']))
    expect(wrapper.find('[data-slot="right"]').classes()).toEqual(expect.arrayContaining(['order-1', 'lg:order-3']))

    appConfig.value.stirTheme.footer.leftSlot = ''
    appConfig.value.stirTheme.footer.centerSlot = ''
    appConfig.value.stirTheme.footer.rightSlot = ''
  })
})
