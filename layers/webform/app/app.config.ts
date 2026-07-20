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
          'text-default pointer-events-none absolute start-0 -top-2.5 text-sm font-medium transition-all duration-150 ease-out [&>span]:rounded-sm',
          'peer-placeholder-shown:text-default/80 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal',
          'peer-focus:text-highlighted peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium',
        ],
      },
      fieldGroupHeader: 'mb-6 text-xl font-semibold',
      fieldGroup: 'space-y-10',
      fieldInput: 'w-full',
      fieldText: '!text-sm !leading-normal',
      response: 'bg-muted rounded-lg px-6 py-3 italic',
      description: 'desc text-muted mb-3',
      help: 'desc text-muted my-3',
      submitAlign: '',
      submitComponent: '',
      buttonClass: '',
      submitButtonSize: '2xl',
      fieldVariant: 'outline',
    },
  },
})
