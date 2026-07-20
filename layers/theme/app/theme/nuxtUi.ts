const materialControlBase =
  'rounded-none border-b-2 border-b-accented bg-transparent px-0! outline-none transition-colors focus:outline-none focus-visible:border-b-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 aria-invalid:border-b-error aria-invalid:focus-visible:ring-error/60 dark:border-b-default dark:aria-invalid:border-b-error'

export const materialTextControl = `text-highlighted ${materialControlBase}`
export const materialSelectControl = `${materialTextControl} min-h-12 py-3!`
export const materialButton = `text-muted ${materialControlBase} min-h-12 w-full justify-start gap-2 py-3 text-base font-normal`

export const nuxtUiTheme = {
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
          base: 'gap-2 px-10 py-3 text-base',
        },
      },
      variant: {
        material: materialButton,
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
      root: 'relative focus:outline-none',
    },
    variants: {
      orientation: {
        horizontal: {
          container: '-ms-0 flex-row',
          item: 'ps-0',
          prev: '!start-5 top-1/2 hidden -translate-y-1/2 opacity-0 transition-opacity md:inline-flex',
          next: '!end-5 top-1/2 hidden -translate-y-1/2 opacity-0 transition-opacity md:inline-flex',
        },
      },
    },
  },

  formField: {
    slots: {
      label: 'block font-medium text-default/80',
      container: 'mt-1',
      error: 'mt-1 text-error',
    },
  },

  input: {
    variants: {
      variant: {
        material: materialTextControl,
      },
    },
    defaultVariants: {
      size: 'xl',
    },
  },

  select: {
    variants: {
      variant: {
        material: materialSelectControl,
      },
    },
    defaultVariants: {
      size: 'xl',
    },
  },

  selectMenu: {
    variants: {
      variant: {
        material: materialSelectControl,
      },
    },
    defaultVariants: {
      size: 'xl',
    },
  },

  inputNumber: {
    variants: {
      size: {
        md: 'gap-1.5 px-2.5 py-1.5 text-base',
      },
      variant: {
        material: materialTextControl,
      },
    },
  },

  textarea: {
    variants: {
      variant: {
        material: materialTextControl,
      },
    },
    defaultVariants: {
      size: 'xl',
      variant: 'material',
    },
  },
} as const
