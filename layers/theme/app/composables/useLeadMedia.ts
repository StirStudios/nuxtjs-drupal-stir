import type { ComputedRef } from 'vue'

/**
 * Whether this paragraph is the first media-bearing paragraph on the page,
 * whose leading images are likely the Largest Contentful Paint and so load
 * eagerly. Setup runs in document order on the server; the claimed key
 * travels in the payload, so hydration reaches the same answer.
 */
export function useLeadMedia(key: string | number | undefined): ComputedRef<boolean> {
  const route = useRoute()
  const lead = useState<string | null>(`stir-lead-media:${route.path}`, () => null)
  const id = key === undefined || key === '' ? '' : String(key)

  if (id && lead.value === null) lead.value = id

  return computed(() => Boolean(id) && lead.value === id)
}
