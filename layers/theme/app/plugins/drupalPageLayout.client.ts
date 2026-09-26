// On client navigation to a Drupal page, the current layout (and its props,
// such as an auth page's) carries over until Drupal/PageRoute.vue sets the new
// page's layout once its payload loads. Without it, NuxtLayout would build the
// default layout for a site-layout page and then swap back, and that
// throwaway header's setup can reset shared state. The server side is
// drupalPageLayout.server.ts.
export default defineNuxtPlugin(() => {
  addRouteMiddleware('drupal-page-layout', (to, from) => {
    if (to.meta.drupalPage !== true || to.meta.layout !== undefined) return

    to.meta.layout = from.meta.layout
    to.meta.layoutProps = from.meta.layoutProps
  }, { global: true })
})
