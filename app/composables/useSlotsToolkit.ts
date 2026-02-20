import type { VNode } from 'vue'
import { isVNode, onMounted, ref, computed } from 'vue'

type SlotMap = Record<string, (() => VNode[]) | undefined>

export function useSlotVNode(slots: unknown, name: string): VNode[] {
  const slotMap = slots as SlotMap
  const content = slotMap[name]?.()

  return Array.isArray(content) ? content : []
}

export function getVNodeProps(vnode: VNode | undefined) {
  return vnode && isVNode(vnode) ? (vnode.props ?? {}) : {}
}

export function extractHeroMedia(slots: unknown) {
  const heroNodes = useSlotVNode(slots, 'hero')

  if (!heroNodes.length) return null

  const heroVNode = heroNodes[0]

  if (!heroVNode) return null
  const children = heroVNode.children as { media?: () => VNode[] } | undefined
  const nested = children?.media?.()

  return Array.isArray(nested) ? (nested[0] ?? null) : null
}

export function extractMediaItems(slots: unknown): VNode[] {
  return useSlotVNode(slots, 'media')
}

export function isVNodeMediaEmbed(vnode: VNode | undefined): boolean {
  const props = getVNodeProps(vnode)

  return !!props.mediaEmbed
}

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items]

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = arr[i]
    const next = arr[j]

    if (current === undefined || next === undefined) continue
    arr[i] = next
    arr[j] = current
  }
  return arr
}

function hydrateOrder<T>(baseFn: () => T[], clientFn: () => T[]) {
  const clientList = ref<T[] | null>(null)

  onMounted(() => {
    clientList.value = clientFn()
  })

  return computed(() => clientList.value ?? baseFn())
}

export function useSlotsToolkit(slots: unknown) {
  const slot = (name: string): VNode[] => useSlotVNode(slots, name)
  const heroMedia = () => extractHeroMedia(slots)
  const mediaItems = () => extractMediaItems(slots)
  const isMediaEmbed = (vnode: VNode | undefined) => isVNodeMediaEmbed(vnode)

  return {
    slots,
    slot,
    propsOf: getVNodeProps,
    heroMedia,
    mediaItems,
    shuffle: shuffleArray,
    isMediaEmbed,
    hydrateOrder,
  }
}
