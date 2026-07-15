import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

describe('Nuxt E2E smoke', async () => {
  await setup({
    browser: false,
    nuxtConfig: {
      sourcemap: {
        client: false,
        server: false,
      },
      vite: {
        build: {
          sourcemap: false,
        },
      },
    },
  })

  it('returns health endpoint payload', async () => {
    const response = await $fetch<{ ok: boolean, service: string }>('/api/health')

    expect(response).toEqual({
      ok: true,
      service: 'nuxtjs-drupal-stir',
    })
  })

  it('keeps public configuration endpoints available', async () => {
    const [authConfig, seo] = await Promise.all([
      $fetch<Record<string, unknown>>('/api/auth/config'),
      $fetch<{ meta: unknown[], link: unknown[] }>('/api/seo/global'),
    ])

    expect(authConfig).toBeTypeOf('object')
    if ('version' in authConfig) expect(authConfig.version).toBeTypeOf('number')
    expect(seo).toEqual({ meta: [], link: [] })
  })
})
