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
      formClass: '',
      labels: {
        base: [
          'text-default pointer-events-none absolute z-10 text-sm font-medium transition-all duration-150 ease-out',
          'peer-placeholder-shown:text-dimmed peer-placeholder-shown:text-base peer-placeholder-shown:font-normal',
          'peer-focus:text-primary peer-focus:text-sm peer-focus:font-medium',
        ],
      },
      fieldGroupHeader: 'mb-6 text-xl font-semibold',
      fieldGroup: 'mb-14 space-y-5',
      fieldInput: 'w-full',
      fieldText: '',
      response: 'bg-muted rounded-lg px-6 py-3 italic',
      description: 'text-muted mb-2 text-sm',
      help: 'text-muted my-3 text-sm',
      submitAlign: '',
      submitComponent: '',
      buttonClass: '',
      submitButtonSize: '2xl',
    },
  },
})
