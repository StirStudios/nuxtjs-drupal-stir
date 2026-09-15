import type { SitemapRenderCtx } from '@nuxtjs/sitemap'
import { normalizeEnvironmentUrl } from '../../config/runtime'
import {
  buildSitemapModuleOptions,
  dedupeResolvedSitemapUrls,
} from '../../config/sitemap'

const drupalUrl = normalizeEnvironmentUrl(process.env.DRUPAL_URL)

export default defineNuxtConfig({
  // Foundation registers Robots, which enforces the site's indexability.
  extends: ['../foundation'],

  // Robots resolves these into its noindex header and meta on every build.
  routeRules: {
    '/account/**': { robots: false },
    '/auth/**': { robots: false },
    '/login': { robots: false },
  },

  nitro: {
    hooks: {
      'sitemap:resolved'(ctx: SitemapRenderCtx) {
        ctx.urls = dedupeResolvedSitemapUrls(ctx.urls)
      },
    } as Record<string, (ctx: SitemapRenderCtx) => void>,
  },

  modules: [
    [
      '@nuxtjs/sitemap',
      buildSitemapModuleOptions(drupalUrl),
    ],
  ],
})
