import { computed } from 'vue'
import type { ComputedRef, Slots } from 'vue'
import { useNodeTeaser } from './useNode'
import { usePageContext } from './usePageContext'

export const DEFAULT_NODE_TEASER_TYPES = ['teaser', 'listing', 'card'] as const

export interface NodeDefaultProps {
  title: string
  type?: string
  isArticle?: boolean | string
  created?: string
  editLink?: string
  uid?: string | object
  hide?: boolean | string
  path?: {
    alias: string
    pid: string
    langcode: string
  }
  id?: string | number
  nid?: string | number
  url?: string
  related?: {
    prevNode?: {
      nid: string
      title: string
      url: string
    } | null
    nextNode?: {
      nid: string
      title: string
      url: string
    } | null
  }
}

interface UseNodeDefaultStateOptions {
  teaserTypes?: ReadonlyArray<string>
}

interface NodeDefaultState {
  isTeaser: ComputedRef<boolean>
  isArticle: ComputedRef<boolean>
  showHero: ComputedRef<boolean>
  teaser: ReturnType<typeof useNodeTeaser> | undefined
}

export function useNodeDefaultState(
  props: Pick<NodeDefaultProps, 'type' | 'isArticle'>,
  slots: Slots,
  options: UseNodeDefaultStateOptions = {},
): NodeDefaultState {
  const { pageLayout } = usePageContext()

  const teaserTypes = options.teaserTypes ?? DEFAULT_NODE_TEASER_TYPES
  const isTeaser = computed(() => {
    const type = props.type || ''

    return teaserTypes.some((typeName) => type.includes(typeName))
  })
  const isArticle = computed(() => !!props.isArticle)
  const showHero = computed(() => pageLayout.value !== 'clear' && !isTeaser.value)

  return {
    isTeaser,
    isArticle,
    showHero,
    teaser: useNodeTeaser(slots),
  }
}
