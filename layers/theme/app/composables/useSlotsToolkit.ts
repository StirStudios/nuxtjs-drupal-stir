import type { MaybeRefOrGetter, VNode } from 'vue'
import { Fragment, isVNode, onMounted, ref, computed, toValue } from 'vue'

type SlotMap = Record<string, (() => unknown) | undefined>
export type VNodePropsRecord = Record<string, unknown>
export type VNodeInput = MaybeRefOrGetter<VNode[] | null | undefined>
export type VNodePredicate = (
  node: VNode,
  index: number,
  nodes: VNode[],
) => boolean

function normalizeVNodes(content: unknown): VNode[] {
  const items = Array.isArray(content) ? content : [content]
  const nodes: VNode[] = []

  for (const item of items) {
    if (!isVNode(item)) continue

    if (item.type === Fragment) {
      nodes.push(...normalizeVNodes(item.children))
      continue
    }

    nodes.push(item)
  }

  return nodes
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

export function getVNodeProps<T extends VNodePropsRecord = VNodePropsRecord>(
  vnode: VNode | undefined,
): T {
  return (vnode && isVNode(vnode) ? (vnode.props ?? {}) : {}) as T
}

export function getVNodeChildren(vnode: VNode | undefined): VNode[] {
  if (!vnode?.children) {
    return []
  }

  if (Array.isArray(vnode.children)) {
    return normalizeVNodes(vnode.children)
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
  const all: VNode[] = []
  const stack = [...nodes].reverse()

  while (stack.length) {
    const node = stack.pop()

    if (!node) continue

    all.push(node)
    stack.push(...getVNodeChildren(node).reverse())
  }

  return all
}

function resolveNodeInput(input: VNodeInput): VNode[] {
  return toValue(input) ?? []
}

export function getVNodeElement(vnode: VNode | undefined): string {
  const element = getVNodeProps(vnode).element

  if (typeof element === 'string') return element
  if (typeof vnode?.type === 'string') return vnode.type

  return ''
}

export function getVNodeProp<T = unknown>(
  vnode: VNode | undefined,
  key: string,
): T | undefined {
  return getVNodeProps(vnode)[key] as T | undefined
}

export function findVNodes(
  nodes: VNode[],
  predicate: VNodePredicate,
): VNode[] {
  return getAllVNodes(nodes).filter(predicate)
}

export function findVNodesByElement(nodes: VNode[], element: string): VNode[] {
  return findVNodes(nodes, (node) => getVNodeElement(node) === element)
}

export function findVNodesByProp(
  nodes: VNode[],
  key: string,
  value: unknown,
): VNode[] {
  return findVNodes(nodes, (node) => getVNodeProp(node, key) === value)
}

export function useVNodes(input: VNodeInput) {
  const allNodes = computed(() => getAllVNodes(resolveNodeInput(input)))
  const filter = (predicate: VNodePredicate) => allNodes.value.filter(predicate)
  const byProp = (key: string, value: unknown) =>
    filter((node) => getVNodeProp(node, key) === value)

  return {
    all: () => allNodes.value,
    filter,
    byElement: (element: string) =>
      filter((node) => getVNodeElement(node) === element),
    byProp,
    byParent: (parentUuid: unknown) =>
      parentUuid === undefined || parentUuid === null
        ? []
        : byProp('parentUuid', parentUuid),
    byRegion: (region: string) => byProp('region', region),
    propsOf: getVNodeProps,
    propOf: getVNodeProp,
    elementOf: getVNodeElement,
    childrenOf: getVNodeChildren,
    slotChildrenOf: getVNodeSlotChildren,
  }
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
  const query = (nodes: VNodeInput) => useVNodes(nodes)
  const childrenOf = (vnode: VNode | undefined): VNode[] => getVNodeChildren(vnode)
  const slotChildrenOf = (vnode: VNode | undefined, name: string): VNode[] =>
    getVNodeSlotChildren(vnode, name)
  const heroMedia = () => extractHeroMedia(slots)
  const mediaItems = () => extractMediaItems(slots)
  const isMediaEmbed = (vnode: VNode | undefined) => isVNodeMediaEmbed(vnode)
  const propsOf = <T extends VNodePropsRecord = VNodePropsRecord>(
    vnode: VNode | undefined,
  ): T => getVNodeProps<T>(vnode)

  return {
    slots,
    slot,
    all,
    query,
    childrenOf,
    slotChildrenOf,
    propsOf,
    heroMedia,
    mediaItems,
    shuffle: shuffleArray,
    isMediaEmbed,
    hydrateOrder,
  }
}

export type SlotsToolkit = ReturnType<typeof useSlotsToolkit>
