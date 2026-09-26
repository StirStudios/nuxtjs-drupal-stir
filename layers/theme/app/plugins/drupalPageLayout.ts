import { serverPageFetchOptions, withoutLegacyDrupalViewPage } from '#stir/utils/pageRequest'

// app.vue's NuxtLayout persists across navigations and follows the router's
// route, so a Drupal page's layout (default, clear, links or a site's own)
// must be on the route before it renders. Its page_layout arrives with the
// page payload, so:
// - the server fetches the payload here, and the page's own fetchPage()
//   reuses it (serverPageFetchOptions), so Drupal is asked once;
// - on client navigation the current layout (and its props, such as an auth
//   page's) carries over, and Drupal/PageRoute.vue sets the new page's layout
//   once its payload loads.
//   Fetching here instead would put the Drupal CE client in the initial
//   browser bundle. Without the carry-over, NuxtLayout would build the default
//   layout for a site-layout page and then swap back, and that throwaway
//   header's setup can reset shared state.
export default defineNuxtPlugin((nuxtApp) => {
  addRouteMiddleware('drupal-page-layout', async (to, from) => {
    if (to.meta.drupalPage !== true) return

    if (import.meta.client) {
      if (to.meta.layout === undefined) {
        to.meta.layout = from.meta.layout
        to.meta.layoutProps = from.meta.layoutProps
      }

      return
    }

    if ('page' in to.query) return

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
