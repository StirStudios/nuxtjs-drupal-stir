import { describe, expect, it } from 'vitest'
import type { NuxtError } from '#app'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ErrorPage from '../../../layers/theme/app/error.vue'

const errorConfig = ref<Record<string, unknown>>({})

mockNuxtImport('useAppConfig', () => () => ({
  stirTheme: { error: errorConfig.value },
  icon: { provider: 'none', collections: [] },
  ui: {},
}))

const render = async (statusCode: number, data?: Record<string, unknown>) =>
  (await mountSuspended(ErrorPage, {
    props: { error: { statusCode, statusMessage: 'Service Unavailable', message: 'Service Unavailable', data } as unknown as NuxtError },
  })).text()

describe('error page', () => {
  it('shows planned maintenance for a 503, which Drupal sends in Maintenance mode', async () => {
    errorConfig.value = {}
    const text = await render(503)

    expect(text).toContain('Back shortly')
    expect(text).toContain('We are making some improvements')
    expect(text).not.toContain('Content service unavailable')
    expect(text).not.toContain('Back to home')
  })

  it('shows the maintenance message Drupal sends, ahead of the project fallback', async () => {
    errorConfig.value = { maintenance: { message: 'Fallback wording.' } }
    const text = await render(503, { maintenanceMessage: 'DancePlug is currently under maintenance.' })

    expect(text).toContain('DancePlug is currently under maintenance.')
    expect(text).not.toContain('Fallback wording.')
  })

  it('uses the project wording for maintenance', async () => {
    errorConfig.value = { maintenance: { title: 'Improving DancePlug', message: 'Classes are back in a few minutes.' } }
    const text = await render(503)

    expect(text).toContain('Improving DancePlug')
    expect(text).toContain('Classes are back in a few minutes.')
  })

  it('keeps the backend-failure wording for 502 and 504', async () => {
    errorConfig.value = {}

    for (const code of [502, 504]) {
      const text = await render(code)

      expect(text).toContain('Content service unavailable')
      expect(text).not.toContain('Back shortly')
    }
  })
})
