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
          'pointer-events-none absolute -top-2 start-0 z-10 text-sm font-medium text-default transition-all duration-150 ease-out',
          'peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-dimmed',
          'peer-focus:-top-2 peer-focus:text-sm peer-focus:font-medium peer-focus:text-primary',
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
    },
  },
})
