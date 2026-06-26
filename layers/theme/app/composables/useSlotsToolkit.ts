import type { VNode } from 'vue'
import { isVNode, onMounted, ref, computed } from 'vue'

type SlotMap = Record<string, (() => unknown) | undefined>

function normalizeVNodes(content: unknown): VNode[] {
  const items = Array.isArray(content) ? content : [content]

  return items.filter(isVNode)
}

function normalizeVNodeSlotValue(slotValue: unknown): VNode[] {
  if (typeof slotValue === 'function') {
    return normalizeVNodes(slotValue())
  }

  return normalizeVNodes(slotValue)
}

export function useSlotVNode(slots: unknown, name: string): VNode[] {
  const slotMap = slots as SlotMap
  const content = slotMap[name]?.()

  return normalizeVNodes(content)
}

export function getVNodeProps(vnode: VNode | undefined) {
  return vnode && isVNode(vnode) ? (vnode.props ?? {}) : {}
}

export function getVNodeChildren(vnode: VNode | undefined): VNode[] {
  if (!vnode?.children) {
    return []
  }

  if (Array.isArray(vnode.children)) {
    return vnode.children.filter(isVNode)
  }

  if (typeof vnode.children === 'object') {
    return Object.values(vnode.children).flatMap(normalizeVNodeSlotValue)
  }

  return []
}

export function getVNodeSlotChildren(
  vnode: VNode | undefined,
  name: string,
): VNode[] {
  if (!vnode?.children || Array.isArray(vnode.children)) {
    return []
  }

  if (typeof vnode.children === 'object') {
    return normalizeVNodeSlotValue(
      (vnode.children as Record<string, unknown>)[name],
    )
  }

  return []
}

export function getAllVNodes(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => [node, ...getAllVNodes(getVNodeChildren(node))])
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
  const all = (nodes: VNode[]): VNode[] => getAllVNodes(nodes)
  const childrenOf = (vnode: VNode | undefined): VNode[] => getVNodeChildren(vnode)
  const slotChildrenOf = (vnode: VNode | undefined, name: string): VNode[] =>
    getVNodeSlotChildren(vnode, name)
  const heroMedia = () => extractHeroMedia(slots)
  const mediaItems = () => extractMediaItems(slots)
  const isMediaEmbed = (vnode: VNode | undefined) => isVNodeMediaEmbed(vnode)

  return {
    slots,
    slot,
    all,
    childrenOf,
    slotChildrenOf,
    propsOf: getVNodeProps,
    heroMedia,
    mediaItems,
    shuffle: shuffleArray,
    isMediaEmbed,
    hydrateOrder,
  }
}
