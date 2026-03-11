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
  const hasMediaSource = (value: unknown) => {
    if (!value || typeof value !== 'object') return false

    const media = value as Record<string, unknown>

    return typeof media.src === 'string' && media.src.trim().length > 0
  }

  const source = computed(() => {
    const section = node.section
    const hero = node.hero

    if (section?.vnode && hasMediaSource(section.media)) return section
    if (hero?.vnode && hasMediaSource(hero.media)) return hero
    if (section?.vnode) return section
    if (hero?.vnode) return hero

    return {
      props: {},
      media: {},
      text: '',
    }
  })

  return source
}
