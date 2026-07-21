import type { SitemapRenderCtx } from '@nuxtjs/sitemap'
import { normalizeEnvironmentUrl } from '../../config/runtime'
import {
  buildSitemapModuleOptions,
  dedupeResolvedSitemapUrls,
} from '../../config/sitemap'

const drupalUrl = normalizeEnvironmentUrl(process.env.DRUPAL_URL)

export default defineNuxtConfig({
  routeRules: {
    '/account/**': {
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    },
    '/auth/**': {
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    },
    '/login': {
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    },
  },

  nitro: {
    hooks: {
      'sitemap:resolved'(ctx: SitemapRenderCtx) {
        ctx.urls = dedupeResolvedSitemapUrls(ctx.urls)
      },
    } as Record<string, (ctx: SitemapRenderCtx) => void>,
  },

  modules: [
    '@nuxtjs/robots',
    [
      '@nuxtjs/sitemap',
      buildSitemapModuleOptions(drupalUrl),
    ],
  ],
})
