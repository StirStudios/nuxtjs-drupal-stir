import {
  mergeDrupalPageAccess,
  resolveDrupalPageAccess,
} from '../utils/editorialAccess'
import { useAuthSession } from '../../../auth/app/composables/useAuthSession'

export function usePageContext() {
  const { getPage } = useStirDrupalCe()
  const page = getPage()
  const route = useRoute()
  const session = useAuthSession()

  onMounted(() => {
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
  const routeAccess = computed(() => resolveDrupalPageAccess(page.value))
  const sessionAccess = computed(() => resolveDrupalPageAccess({
    current_user: session.user.value
      ? {
          authenticated: session.loggedIn.value,
          id: session.user.value.uid,
          uid: session.user.value.uid,
          roles: session.user.value.roles,
        }
      : null,
  }))
  const access = computed(() => mergeDrupalPageAccess(
    routeAccess.value,
    sessionAccess.value,
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
