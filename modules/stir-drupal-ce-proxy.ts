import type { Nuxt } from '@nuxt/schema'
import { addServerHandler, createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'stir-drupal-ce-proxy',
  },
  setup(_: Record<string, never>, nuxt: Nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.drupalCe = {
      ...nuxt.options.runtimeConfig.public.drupalCe,
      serverApiProxy: true,
    }

    addServerHandler({
      route: '/api/drupal-ce',
      handler: resolve('../server/handlers/drupal-ce-proxy'),
    })
    addServerHandler({
      route: '/api/drupal-ce/**',
      handler: resolve('../server/handlers/drupal-ce-proxy'),
    })
    addServerHandler({
      route: '/api/menu/**',
      handler: resolve('../server/handlers/menu-proxy'),
    })
  },
})
