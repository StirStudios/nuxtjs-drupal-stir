import { serverPageFetchOptions, withoutLegacyDrupalViewPage } from '#stir/utils/pageRequest'

// app.vue's NuxtLayout persists across navigations, so a Drupal page's layout
// (default, clear, links or a site's own) must be known before render. On the
// server the page payload is fetched here, and the page's own fetchPage()
// reuses it (serverPageFetchOptions), so Drupal is asked once. On client navigation
// Drupal/PageRoute.vue sets the layout from the page it loads.
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client || to.meta.drupalPage !== true || 'page' in to.query) return

  const { fetchPage } = useStirDrupalCe()
  const { path } = useResolvedPageRequest(to)

  try {
    const page = await fetchPage(path.value, {
      query: withoutLegacyDrupalViewPage(to.query),
      ...serverPageFetchOptions(),
    })

    setDrupalPageLayout(resolveDrupalPageLayout(page.value?.page_layout))
  } catch {
    // Drupal/PageRoute.vue reports the error when it fetches the page.
  }
})
