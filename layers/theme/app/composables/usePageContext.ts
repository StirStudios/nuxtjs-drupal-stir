import {
  mergeDrupalPageAccess,
  resolveAuthSessionAccess,
  resolveDrupalPageAccess,
} from '../utils/editorialAccess'
import { isDrupalRenderedRoute } from '../utils/drupalPage'

export function usePageContext(page = useStirDrupalCe().getPage()) {
  const route = useRoute()
  // Null when the auth layer is not installed: the page payload alone decides.
  const session = useOptionalAuthSession()

  onMounted(() => {
    // The drupal-session-no-ssr safeguard disables SSR for any request carrying
    // a Drupal session cookie, so a server-rendered load is always anonymous and
    // must never spend a session request on a public page.
    if (!session || useNuxtApp().payload.serverRendered) return

    void session.fetchSession().catch(() => {
      // Route payload access remains available if the session check fails.
    })
  })
  const isFront = computed(() => {
    if (!isDrupalRenderedRoute(route)) return false

    return page.value?.is_front_page === true
  })
  const access = computed(() => mergeDrupalPageAccess(
    resolveDrupalPageAccess(page.value),
    resolveAuthSessionAccess({
      loggedIn: session?.loggedIn.value ?? false,
      user: session?.user.value ?? null,
    }),
  ))
  const isAuthenticated = computed(() => access.value.isAuthenticated)
  const hasEditorialAccess = computed(() => access.value.hasEditorialAccess)
  // Drupal sends this only when the site has a dashboard route the account
  // may open, so the frontend never links to a page it cannot reach.
  const adminDashboardUrl = computed(() => access.value.adminDashboardUrl)
  // Drupal emits editLink only when the entity may be updated; explicit edit
  // targets on node pages rely on the page's editorial access instead. Saves
  // are still access-checked by Drupal.
  const canEditInline = (editLink?: string): boolean =>
    Boolean(editLink) || hasEditorialAccess.value

  const pageLayout = computed(() => page.value?.page_layout || '')

  return {
    isFront,
    isAuthenticated,
    hasEditorialAccess,
    adminDashboardUrl,
    canEditInline,
    pageLayout,
  }
}
