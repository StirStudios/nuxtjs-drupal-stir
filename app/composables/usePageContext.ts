export function usePageContext() {
  const { getPage } = useDrupalCe()
  const page = getPage()
  const route = useRoute()
  const isFront = computed(() => {
    const hasDrupalSlugParam = Object.hasOwn(route.params, 'slug')
    const isDrupalRenderedRoute = route.path === '/' || hasDrupalSlugParam

    if (!isDrupalRenderedRoute) return false

    return page.value?.is_front_page === true
  })
  const isAdministrator = computed(
    () => page.value?.current_user?.roles?.includes('administrator') || false,
  )

  const pageLayout = computed(() => page.value?.page_layout || '')

  return {
    isFront,
    isAdministrator,
    pageLayout,
  }
}
