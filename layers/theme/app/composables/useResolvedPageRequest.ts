import { resolvePageRequest, type PageRequestRoute } from '#stir/utils/pageRequest'

export function useResolvedPageRequest(route: PageRequestRoute = useRoute()) {
  const path = computed(() => resolvePageRequest(route).path)
  const key = computed(() => resolvePageRequest(route).key)

  return {
    path,
    key,
  }
}
