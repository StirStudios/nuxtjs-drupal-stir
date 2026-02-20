import type { VNode } from 'vue'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'

/**
 * Extracts paragraph-like slot data (`section`, `hero`, or custom slots).
 */
export function useNode(slots: unknown) {
  const tk = useSlotsToolkit(slots)

  /**
   * Extracts `vnode`, `props`, `text`, and nested `media` from a slot.
   */
  const useParagraph = (slotName: string) => {
    const vnode = computed<VNode | undefined>(() => {
      return tk.slot(slotName)[0] ?? undefined
    })

    const props = computed(() => tk.propsOf(vnode.value) ?? {})
    const mediaProps = computed(() => {
      const node = vnode.value

      if (!node) return {}

      type SlotDict = Record<string, (() => VNode[]) | undefined>
      const children = node.children as unknown as SlotDict
      const mediaFn = children.media

      if (!mediaFn) return {}

      const mediaVNode = mediaFn()?.[0]

      return tk.propsOf(mediaVNode) ?? {}
    })

    const text = computed(() =>
      typeof props.value.text === 'string' ? props.value.text : '',
    )

    return {
      get vnode() {
        return vnode.value
      },
      get props() {
        return props.value
      },
      get media() {
        return mediaProps.value
      },
      get text() {
        return text.value
      },
    }
  }

  return {
    section: useParagraph('section'),
    hero: useParagraph('hero'),

    paragraph(slotName: string) {
      return useParagraph(slotName)
    },
  }
}

/**
 * Returns the first available teaser source (`section`, then `hero`).
 */
export function useNodeTeaser(slots: unknown) {
  const node = useNode(slots)
  const source = computed(() => {
    if (node.section?.vnode) return node.section
    if (node.hero?.vnode) return node.hero
    return {
      props: {},
      media: {},
      text: '',
    }
  })

  return source
}
