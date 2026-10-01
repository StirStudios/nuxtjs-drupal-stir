import { pageFetchOptions, withoutLegacyDrupalViewPage } from '#stir/utils/pageRequest'

// app.vue's NuxtLayout persists across navigations and follows the router's
// route, so a Drupal page's layout (default, clear, links or a site's own)
// must be on the route before it renders. The server fetches the page payload
// here, and the page's own fetchPage() reuses it (pageFetchOptions), so
// Drupal is asked once. drupalPageLayout.client.ts does the same in the
// browser.
// This stays a separate server-only plugin: in a universal plugin the Drupal
// CE client lands in the initial browser bundle even behind an
// import.meta.server guard, because its import is kept.
export default defineNuxtPlugin((nuxtApp) => {
  addRouteMiddleware('drupal-page-layout', async (to) => {
    if (!takesDrupalPageLayout(to)) return

    const { fetchPage } = useStirDrupalCe()
    const { path } = useResolvedPageRequest(to)
    let pageLayout: unknown

    try {
      const page = await fetchPage(path.value, {
        query: withoutLegacyDrupalViewPage(to.query),
        ...pageFetchOptions(),
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
