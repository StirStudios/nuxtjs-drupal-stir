import type { SitemapRenderCtx } from '@nuxtjs/sitemap'
import { normalizeEnvironmentUrl } from '../../config/runtime'
import {
  buildSitemapModuleOptions,
  dedupeResolvedSitemapUrls,
} from '../../config/sitemap'

const drupalUrl = normalizeEnvironmentUrl(process.env.DRUPAL_URL)

export default defineNuxtConfig({
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
