export function usePageContext() {
  const { getPage } = useDrupalCe()
  const page = getPage()
  const route = useRoute()

  const isFront = computed(() => route.path === '/')
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
