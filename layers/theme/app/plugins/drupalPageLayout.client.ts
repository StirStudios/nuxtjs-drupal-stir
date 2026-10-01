import { forgetPrefetchedPage, rememberPrefetchedPage, withoutLegacyDrupalViewPage } from '../utils/pageRequest'

// On client navigation, and on a browser-rendered first load (signed in),
// fetch the Drupal page here so its layout is on the route before it renders:
// app.vue's NuxtLayout persists, and a layout set after the page has started
// rendering remounts it mid-load or lands on whichever route is current by
// then. The page's fetchPage() reuses this payload (pageFetchOptions), so
// Drupal is asked once. The Drupal CE client is imported here, lazily, to keep
// it out of the initial bundle. The server side is drupalPageLayout.server.ts.
export default defineNuxtPlugin((nuxtApp) => {
  addRouteMiddleware('drupal-page-layout', async (to) => {
    forgetPrefetchedPage(nuxtApp)

    // A server-rendered page already carries its layout into hydration.
    if (!takesDrupalPageLayout(to) || (nuxtApp.isHydrating && nuxtApp.payload.serverRendered)) return

    // The router loads the page's chunk only after middleware; load it while
    // Drupal answers instead.
    preloadRouteComponents(to)

    const { useStirDrupalCe } = await import('../composables/useStirDrupalCe')
    const { path } = useResolvedPageRequest(to)
    let page: { page_layout?: unknown } | undefined

    try {
      page = await nuxtApp.runWithContext(() =>
        useStirDrupalCe().$ceApi({ query: withoutLegacyDrupalViewPage(to.query) })<{ page_layout?: unknown }>(path.value),
      )
    } catch {
      // Drupal/PageRoute.vue fetches the page again and reports the error.
      return
    }

    rememberPrefetchedPage(nuxtApp, to.fullPath, page)
    to.meta.layout = resolveDrupalPageLayout(page?.page_layout) as typeof to.meta.layout
  }, { global: true })
})
