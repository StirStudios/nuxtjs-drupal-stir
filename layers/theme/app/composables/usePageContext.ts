import {
  mergeDrupalPageAccess,
  resolveAuthSessionAccess,
  resolveDrupalPageAccess,
} from '../utils/editorialAccess'
import { useAuthSession } from '../../../auth/app/composables/useAuthSession'

export function usePageContext(page = useStirDrupalCe().getPage()) {
  const route = useRoute()
  const session = useAuthSession()

  onMounted(() => {
    // The drupal-session-no-ssr safeguard disables SSR for any request carrying
    // a Drupal session cookie, so a server-rendered load is always anonymous and
    // must never spend a session request on a public page.
    if (useNuxtApp().payload.serverRendered) return

    void session.fetchSession().catch(() => {
      // Route payload access remains available if the session check fails.
    })
  })
  const isFront = computed(() => {
    const hasDrupalSlugParam = Object.hasOwn(route.params, 'slug')
    const isDrupalRenderedRoute = route.path === '/' || hasDrupalSlugParam

    if (!isDrupalRenderedRoute) return false

    return page.value?.is_front_page === true
  })
  const access = computed(() => mergeDrupalPageAccess(
    resolveDrupalPageAccess(page.value),
    resolveAuthSessionAccess({
      loggedIn: session.loggedIn.value,
      user: session.user.value,
    }),
  ))
  const isAdministrator = computed(() => access.value.isAdministrator)
  const isAuthenticated = computed(() => access.value.isAuthenticated)
  const hasEditorialAccess = computed(() => access.value.hasEditorialAccess)

  const pageLayout = computed(() => page.value?.page_layout || '')

  return {
    isFront,
    isAdministrator,
    isAuthenticated,
    hasEditorialAccess,
    pageLayout,
  }
}
