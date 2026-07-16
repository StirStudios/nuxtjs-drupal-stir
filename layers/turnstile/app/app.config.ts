import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  ui: {} as unknown as NonNullable<AppConfigInput['ui']>,

  stirTheme: {
    turnstile: {
      appearance: 'interaction-only',
    },
  },
})
