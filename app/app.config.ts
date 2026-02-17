import {
  materialVariant,
  materialVariantWithPB,
  materialVariantMuted,
} from './utils/uiVariants'

export default defineAppConfig({
  colorMode: {
    forced: false,
    preference: 'dark',
    showToggle: false,
    lightRoutes: [],
    darkRoutes: [],
  },

  cookieConsent: {
    enabled: false,
  },

  popup: {
    enabled: false,
  },

  stirTheme: {
    pdf: false,
    crumbs: false,

    h1: 'mb-20 text-center text-6xl',
    container: 'max-w-(--ui-container) mx-auto px-4 md:px-5 lg:px-8',
    header: 'md:px-auto fixed top-0 z-30 w-full !p-0',

    navigation: {
      mode: 'fixed',
      logo: true,
      logoSize: 'h-[5rem]',
      // logoScrolledSize: 'h-[4rem]',
      isHidden: false,
      transparentTop: false,
      base: 'h-auto transform py-3 duration-500',
      background:
        'border-none bg-white/90 shadow backdrop-blur-md dark:bg-gray-950/70',
      container: 'flex-wrap',
      color: 'primary',
      variant: 'link',
      toggleType: 'slideover',
      toggleDirection: 'right',
      header: 'h-auto p-4',
      highlight: {
        show: false,
        color: 'primary',
      },
      slideover: {
        logo: true,
        link: 'text-xl text-center block my-3 uppercase',
        body: 'flex h-full flex-col justify-center text-center',
      },
    },

    hero: {
      base: 'hero flex items-center justify-center overflow-hidden',
      mediaSpacing: 'min-h-[22rem] lg:min-h-[35rem] mb-20',
      noMediaSpacing: 'pt-30 lg:pt-54',
      noMediaFallback:
        'bg-gradient-to-b from-gray-900 via-gray-800 to-black/70',
      overlay:
        'relative min-h-[22rem] lg:min-h-[35rem] after:to-bg-black-10 after:absolute after:inset-0 after:z-auto after:h-full after:w-full after:bg-gradient-to-b after:from-black/80 after:via-black/50',
      isFront: 'h-screen',
      image: {
        base: 'absolute min-h-full w-auto max-w-none min-w-full',
        isFront: 'object-right-85 object-cover',
      },
      text: {
        h1: 'mb-0 text-white',
        base: 'z-10 max-w-2xl relative p-5 text-center',
        isFront: 'absolute bottom-0 left-0 p-10 lg:p-24',
      },
      hide: 'pt-30',
    },

    footer: {
      hideEmail: false,
      base: 'mt-20 bg-accented dark:bg-muted/50 py-10 text-default text-sm',
      left: 'text-sm leading-relaxed lg:text-left mt-8 lg:mt-0',
      right: 'lg:items-end flex flex-col items-center gap-2 lg:text-right',
      footerLinks: 'transition-colors text-primary hover:text-primary/90',
      poweredby: true,
    },

    media: {
      base: 'relative h-full w-full overflow-hidden object-cover',
      rounded: 'rounded-xl',

      transitions: {
        fast: 'duration-300',
        slow: 'duration-700',
      },

      effects: {
        scale: 'group-hover:scale-105',
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

    modal: {
      title: true,
      description: {
        media: true,
        default: false,
      },
    },

    webform: {
      scrollToTopOnSuccess: true,
      spacing: 'space-y-5',
      spacingLarge: 'space-y-10',
      labels: {
        floating: false,
        base: [
          'pointer-events-none absolute -top-1.5 left-0 text-xs font-medium text-dimmed transition-all',
          'peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-dimmed',
          'peer-focus:-top-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-highlighted',
        ],
      },
      fieldGroupHeader: 'mb-6 text-xl font-semibold',
      fieldGroup: 'space-y-10',
      fieldInput: 'w-full',
      response: 'px-6 py-3 bg-muted rounded-lg italic',
      description: 'desc mb-3 text-muted',
      help: 'desc my-3 text-muted',
      submitAlign: '',
      buttonSize: '2xl',
      variant: 'outline',
    },

    turnstile: {
      appearance: 'always',
      label: 'Let us know you’re human',
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
      once: false,
    },

    aspectRatios: {
      portrait: 'aspect-[9/16]',
      landscape: 'aspect-[16/9]',
      square: 'aspect-square',
      fourThree: 'aspect-[4/3]',
    },

    scrollButton: {
      base: 'fixed bottom-4 left-4 z-50 rounded-full p-2 shadow-md transition-opacity duration-300',
      icon: 'i-lucide:arrow-up',
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

  ui: {
    colors: {
      primary: 'lime',
      neutral: 'zinc',
    },

    button: {
      slots: {
        base: 'transition-all duration-300',
      },
      variants: {
        size: {
          '2xl': {
            base: 'px-10 py-3 text-md gap-2',
          },
        },
        variant: {
          material: materialVariantMuted,
        },
      },
    },

    modal: {
      slots: {
        title: 'mb-0',
      },
    },

    carousel: {
      slots: {
        root: 'group relative focus:outline-none',
      },
      variants: {
        orientation: {
          horizontal: {
            container: 'flex-row -ms-0',
            item: 'ps-0',
            prev: 'start-5 sm:start-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
            next: 'end-5 sm:end-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
          },
        },
      },
    },

    formField: {
      slots: {
        label: 'block font-medium text-dimmed',
        container: 'mt-1',
        error: 'mt-1 text-error',
      },
    },

    input: {
      variants: {
        variant: {
          material: materialVariant,
        },
      },
      defaultVariants: {
        size: 'xl',
      },
    },

    select: {
      variants: {
        variant: {
          material: materialVariantWithPB,
        },
      },
      defaultVariants: {
        size: 'xl',
      },
    },

    selectMenu: {
      variants: {
        variant: {
          material: materialVariantWithPB,
        },
      },
      defaultVariants: {
        size: 'xl',
      },
    },

    textarea: {
      variants: {
        variant: {
          material: materialVariant,
        },
      },
      defaultVariants: {
        size: 'xl',
        variant: 'material',
      },
    },
  },
})
