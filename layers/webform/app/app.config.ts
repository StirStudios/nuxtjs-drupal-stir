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
          'pointer-events-none absolute -top-1.5 left-0 text-xs font-medium text-default/80 transition-all',
          'peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-default/80',
          'peer-focus:-top-1.5 peer-focus:text-xs peer-focus:font-medium peer-focus:text-highlighted',
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
