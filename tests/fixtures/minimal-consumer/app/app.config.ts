export default defineAppConfig({
  stirTheme: {
    auth: {},
  },

  ui: {
    colors: {
      primary: 'slate',
    },
    button: {
      slots: {
        base: [
          'transition-all duration-300 font-bold uppercase inline-flex items-center',
          'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75',
          'transition-colors',
        ],
      },
      variants: {
        size: {
          xl: {
            base: 'px-6 py-3 text-sm gap-2',
          },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'btn',
        },
        {
          color: 'primary',
          variant: 'outline',
          class: 'btn',
        },
        {
          color: 'primary',
          variant: 'solid',
          active: true,
          class: 'text-inverted bg-primary hover:bg-primary/85',
        },
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
        size: 'xl',
      },
    },
    formField: {
      slots: {
        label: 'font-bold',
      },
    },
    input: {
      variants: {
        variant: {
          outline: 'bg-inherit',
        },
      },
    },
    inputNumber: {
      variants: {
        variant: {
          outline: 'bg-inherit',
        },
      },
    },
  },
})
