import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  ui: {} as unknown as NonNullable<AppConfigInput['ui']>,

  userway: {
    enabled: false,
    account: '',
    loadDelayMs: 5000,
    position: 3,
    size: 'small',
    color: '#ffffff',
    type: '1',
  },
})
