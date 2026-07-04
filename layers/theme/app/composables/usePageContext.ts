export function usePageContext() {
  const { getPage } = useDrupalCe()
  const page = getPage()
  const route = useRoute()

  const simulatedAdmin = computed<boolean | null>(() => {
    if (!import.meta.dev) return null

    const rawAdminQuery = route.query.admin

    if (typeof rawAdminQuery !== 'string' || rawAdminQuery.length === 0) return null

    if (rawAdminQuery === '0' || rawAdminQuery === 'false' || rawAdminQuery === 'off') {
      return false
    }

    if (rawAdminQuery === '1' || rawAdminQuery === 'true' || rawAdminQuery === 'on') {
      return true
    }

    return null
  })

  const isFront = computed(() => {
    const hasDrupalSlugParam = Object.hasOwn(route.params, 'slug')
    const isDrupalRenderedRoute = route.path === '/' || hasDrupalSlugParam

    if (!isDrupalRenderedRoute) return false

    return page.value?.is_front_page === true
  })
  const isAdministrator = computed(
    () => simulatedAdmin.value ?? (page.value?.current_user?.roles?.includes('administrator') || false),
  )

  const pageLayout = computed(() => page.value?.page_layout || '')

  return {
    isFront,
    isAdministrator,
    pageLayout,
  }
}
