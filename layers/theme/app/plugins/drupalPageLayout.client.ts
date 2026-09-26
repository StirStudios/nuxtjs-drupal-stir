// NuxtLayout reads the router's route, which changes as soon as a navigation
// is confirmed, but Drupal/PageRoute.vue only learns the next page's layout
// once its payload loads. Between two Drupal pages, keep the current layout
// until then, so a site layout such as clients isn't swapped for default and
// back: that builds a throwaway header whose setup resets shared state.
export default defineNuxtPlugin(() => {
  addRouteMiddleware('drupal-page-layout', (to, from) => {
    const layout = from.meta.layout

    if (
      to.meta.drupalPage === true
      && from.meta.drupalPage === true
      && to.meta.layout === undefined
      && typeof layout === 'string'
    ) {
      setDrupalPageLayout(layout)
    }
  }, { global: true })
})
