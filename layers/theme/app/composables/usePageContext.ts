import { resolveDrupalPageAccess } from '../utils/editorialAccess'

export function usePageContext() {
  const { getPage } = useStirDrupalCe()
  const page = getPage()
  const route = useRoute()
  const isFront = computed(() => {
    const hasDrupalSlugParam = Object.hasOwn(route.params, 'slug')
    const isDrupalRenderedRoute = route.path === '/' || hasDrupalSlugParam

    if (!isDrupalRenderedRoute) return false

    return page.value?.is_front_page === true
  })
  const access = computed(() => resolveDrupalPageAccess(page.value))
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
