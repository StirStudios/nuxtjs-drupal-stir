import type { AppConfigInput } from 'nuxt/schema'
import { nuxtUiTheme } from './theme/nuxtUi'

export default defineAppConfig({
  cmsGlobalSeo: {
    enabled: false,
    ignoredPathPrefixes: ['/account', '/auth'],
    ignoredPaths: [],
    drupalRouteNames: ['slug'],
  },

  colorMode: {
    forced: false,
    preference: 'dark',
    showToggle: false,
    lightRoutes: [],
    darkRoutes: [],
  },

  privacyNotice: {
    enabled: false,
    mode: 'notice',
    position: 'center',
    dismissible: true,
    title: '',
    message: '',
    messageLinks: 'For more information please review our',
    termsUrl: '',
    privacyUrl: '',
    cookiePolicyUrl: '',
    cookieConsentUrl: '',
    links: [],
    legalLinks: [],
    buttonLabel: 'Got it',
    declineButtonLabel: 'Decline',
  },

  userway: {
    enabled: false,
    account: '',
    loadDelayMs: 5000,
    position: 3,
    size: 'small',
    color: '#ffffff',
    type: '1',
  },

  popup: {
    enabled: false,
    component: '',
  },

  analytics: {
    plausible: {
      domain: '',
    },
  },

  thirdPartyScripts: {
    allowedOrigins: {
      calculator: ['https://piper.b-cdn.net'],
      enzuzo: ['https://app.enzuzo.com'],
    },
  },

  stirTheme: {
    showPdf: false,
    showBreadcrumbs: false,

    heading: 'mb-12 text-center text-6xl lg:mb-20',
    container: 'max-w-(--ui-container) mx-auto px-4 md:px-5 lg:px-8',
    header: 'fixed top-0 z-30 w-full !p-0 md:px-auto',

    navigation: {
      mode: 'fixed',
      logo: true,
      logoClass: 'h-[5rem]',
      // logoScrolledClass: 'h-[4rem]',
      hidden: false,
      transparentAtTop: false,
      base: 'h-auto transform py-3 duration-500',
      background:
        'border-none bg-default/90 shadow backdrop-blur-md dark:bg-default/70',
      container: 'flex-wrap',
      color: 'primary',
      variant: 'link',
      desktopLayout: 'default',
      logoMenuMarker: '--logo--',
      toggleDirection: 'right',
      header: '',
      splitLogo: {
        center: 'flex-1 items-center justify-center',
        container: 'relative',
        desktopNav: 'hidden lg:flex',
        leftNav: 'app-nav app-nav-left',
        logoLink:
          'app-logo-link mx-4 inline-flex shrink-0 items-center lg:mx-8',
        mobileLogo: 'lg:hidden',
        mobileLeft: 'lg:hidden flex items-center gap-1.5',
        right: 'lg:absolute lg:right-4',
        rightNav: 'app-nav app-nav-right',
      },
      highlight: {
        show: false,
        color: 'primary',
      },
      slideover: {
        logo: true,
        angle: false,
        angleDeg: 35,
        angleOffsetX: '1.5rem',
        link: 'min-h-12 justify-start rounded-lg px-4 py-3 text-start text-base font-medium text-default before:rounded-lg hover:text-highlighted hover:before:bg-elevated/60 data-[active]:text-primary data-[active]:before:bg-primary/10 sm:text-lg',
        list: 'w-full space-y-1.5',
        body: 'flex flex-col',
      },
    },

    hero: {
      base: 'hero flex items-center justify-center overflow-hidden',
      mediaSpacing: 'mb-12 min-h-[22rem] lg:mb-20 lg:min-h-[35rem]',
      noMediaSpacing: 'pt-20 lg:pt-54',
      noMediaFallback:
        'bg-gradient-to-b from-gray-900 via-gray-800 to-black/70',
      overlay:
        'relative after:to-bg-black-10 after:absolute after:inset-0 after:z-auto after:h-full after:w-full after:bg-gradient-to-b after:from-black/80 after:via-black/50',
      isFront: 'h-screen',
      image: {
        base: 'absolute min-h-full w-auto max-w-none min-w-full',
        isFront: 'object-cover',
      },
      text: {
        heading: 'mb-0 text-white',
        base: 'relative z-10 max-w-6xl p-5 text-center',
        isFront: 'absolute bottom-0 left-0 p-10 lg:p-24',
      },
      hide: 'pt-15 lg:pt-30',
    },

    frontPage: {
      heading: '',
      main: '',
    },

    footer: {
      layout: 'default',
      requireSiteName: false,
      rights: '',
      base: 'mt-12 bg-accented py-10 text-sm text-default dark:bg-muted/50 lg:mt-20',
      container: '',
      content: 'flex flex-col items-center justify-center gap-4 text-center',
      left: 'mt-8 text-sm leading-relaxed lg:mt-0 lg:text-left',
      right: 'flex flex-col items-center gap-2 lg:items-end lg:text-right',
      copyright: 'mb-0',
      email: '',
      footerLinks: 'transition-colors text-primary hover:text-primary/90',
      logo: '',
      menu: 'mb-3',
      menuItem: 'min-w-0 py-0',
      menuList: 'flex flex-wrap justify-center',
      poweredBy: 'mb-0',
      showCopyright: true,
      showEmail: true,
      showFooterRegion: true,
      showLogo: true,
      showMenu: true,
      showPoweredBy: true,
      showSlogan: false,
      showSocials: true,
      showSubFooterRegion: true,
      slogan: 'mb-2',
      socialIcon: 'me-1',
      socials: 'flex gap-1',
    },

    media: {
      base: 'relative h-full w-full overflow-hidden object-cover',
      rounded: 'rounded-xl',
      video: {
        loadMinWidth: 768,
        loadStrategy: 'after-load',
        wrapper: 'm-auto max-w-6xl',
      },

      transitions: {
        fast: 'duration-300',
        slow: 'duration-700',
      },

      effects: {
        scale: 'group-hover:scale-105 group-hover/blog-post:scale-105',
      },
    },

    carousel: {
      padding: 'pb-12',
      root: '',
      arrows: {
        prev: { color: 'neutral', variant: 'outline', size: 'xl' },
        next: { color: 'neutral', variant: 'outline', size: 'xl' },
        prevIcon: 'i-lucide-chevron-left',
        nextIcon: 'i-lucide-chevron-right',
      },
    },

    mediaModal: {
      title: true,
      description: {
        media: true,
        default: false,
      },
    },

    overlay: {
      portal: true,
    },

    card: {
      base: 'relative isolate overflow-hidden rounded-xl bg-black/80 dark:bg-black text-white',
      effect:
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl aspect-[1155/678] opacity-40 z-0',
      sizes: {
        default: 'w-[72rem]',
        compact: 'w-[120%] opacity-35',
      },
      defaultGradient: '1',
    },

    gradients: {
      1: 'bg-gradient-to-tr from-[#f35b0f] to-[#6b4ef2]',
      2: 'bg-gradient-to-r from-[#fde047] via-[#facc15] to-[#2563eb]',
      3: 'bg-gradient-to-b from-[#166534] via-[#22c55e] to-[#38bdf8]',
      4: 'bg-gradient-to-br from-[#0f172a] via-[#1d4ed8] to-[#38bdf8]',
      5: 'bg-gradient-to-tr from-[#22d3ee] via-[#38bdf8] to-[#a855f7]',
      6: 'bg-gradient-to-r from-[#111827] via-[#dc2626] to-[#f59e0b]',
    },

    animations: {
      once: true,
      reveal: {
        durationMs: 1200,
        staggerMs: 250,
        ease: [0.22, 1, 0.36, 1],
      },
    },

    scrollButton: {
      enabled: true,
      base: 'fixed bottom-4 left-4 z-50 rounded-full p-2 shadow-md transition-opacity duration-300',
      icon: 'i-lucide-arrow-up',
      variant: 'solid',
      showAtScrollY: 200,
    },

    error: {
      label: 'Back to home',
      color: 'primary',
      size: 'xl',
      icon: 'i-lucide-arrow-left',
      variant: 'solid',
    },
  },

  ui: nuxtUiTheme as unknown as NonNullable<AppConfigInput['ui']>,
})
