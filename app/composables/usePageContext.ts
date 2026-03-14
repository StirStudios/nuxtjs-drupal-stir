export function usePageContext() {
  const { getPage } = useDrupalCe()
  const page = getPage()
  const route = useRoute()

  const isFront = computed(() => {
    const slug = route.params.slug
    const slugValue = Array.isArray(slug) ? slug[0] : slug

    return route.path === '/' || route.path === '/front' || slugValue === 'front'
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
