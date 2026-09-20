import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  // AppConfigInput requires `ui`; Nuxt UI's theme type is too deep to spell
  // out here, and every layer contributes only its own keys.
  ui: {} as unknown as NonNullable<AppConfigInput['ui']>,


  stirTheme: {
    turnstile: {
      appearance: 'interaction-only',
    },
  },
})
