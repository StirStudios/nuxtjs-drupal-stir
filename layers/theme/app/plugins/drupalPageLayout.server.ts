import { serverPageFetchOptions, withoutLegacyDrupalViewPage } from '#stir/utils/pageRequest'

// app.vue's NuxtLayout persists across navigations, so a Drupal page's layout
// (default, clear, links or a site's own) must be known before render. The
// server fetches the page payload here, and the page's own fetchPage() reuses
// it (serverPageFetchOptions), so Drupal is asked once. On client navigation
// Drupal/PageRoute.vue sets the layout from the page it loads. A server-only
// plugin keeps the Drupal CE client out of the initial browser bundle, which
// a global route middleware would add.
export default defineNuxtPlugin((nuxtApp) => {
  addRouteMiddleware('drupal-page-layout', async (to) => {
    if (to.meta.drupalPage !== true || 'page' in to.query) return

    const { fetchPage } = useStirDrupalCe()
    const { path } = useResolvedPageRequest(to)
    let pageLayout: unknown

    try {
      const page = await fetchPage(path.value, {
        query: withoutLegacyDrupalViewPage(to.query),
        ...serverPageFetchOptions(),
      })

      pageLayout = page.value?.page_layout
    } catch {
      // Drupal/PageRoute.vue reports the error when it fetches the page.
      return
    }

    // An inline middleware loses the Nuxt context after an await.
    nuxtApp.runWithContext(() => setDrupalPageLayout(resolveDrupalPageLayout(pageLayout)))
  }, { global: true })
})
