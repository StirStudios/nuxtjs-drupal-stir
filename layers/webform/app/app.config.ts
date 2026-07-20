import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  ui: {} as unknown as NonNullable<AppConfigInput['ui']>,

  stirTheme: {
    webform: {
      showToasts: true,
      scrollToTopOnSuccess: true,
      scrollToTopOnReset: true,
      scrollToTopDelayMs: 0,
      scrollToTopFallbackDelayMs: 180,
      spacing: 'space-y-5',
      spacingLarge: 'space-y-10',
      formClass: '',
      labels: {
        floating: false,
        base: [
          'pointer-events-none absolute -top-2.5 start-0 text-sm font-medium text-default transition-all duration-150 ease-out [&>span]:rounded-sm',
          'peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-default/80',
          'peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium peer-focus:text-highlighted',
        ],
      },
      fieldGroupHeader: 'mb-6 text-xl font-semibold',
      fieldGroup: 'space-y-10',
      fieldInput: 'w-full',
      fieldText: '!text-sm !leading-normal',
      response: 'rounded-lg bg-muted px-6 py-3 italic',
      description: 'desc mb-3 text-muted',
      help: 'desc my-3 text-muted',
      submitAlign: '',
      submitComponent: '',
      buttonClass: '',
      submitButtonSize: '2xl',
      fieldVariant: 'outline',
    },
  },
})
