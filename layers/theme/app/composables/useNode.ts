import { computed } from 'vue'
import type { VNode } from 'vue'
import { useSlotsToolkit } from './useSlotsToolkit'

/**
 * Extracts paragraph-like slot data (`section`, `hero`, or custom slots).
 */
export function useNode(slots: unknown) {
  const tk = useSlotsToolkit(slots)

  /**
   * Extracts `vnode`, `props`, `text`, and nested `media` from a slot.
   */
  const useParagraph = (slotName: string) => {
    const nodes = computed<VNode[]>(() => tk.all(tk.slot(slotName)))
    const vnode = computed<VNode | undefined>(() => nodes.value[0] ?? undefined)
    const textNode = computed<VNode | undefined>(() =>
      nodes.value.find((node) => {
        const text = tk.propsOf(node).text

        return typeof text === 'string' && text.trim().length > 0
      }),
    )
    const mediaNode = computed<VNode | undefined>(() =>
      nodes.value.find((node) => tk.slotChildrenOf(node, 'media').length > 0),
    )
    const props = computed(() =>
      tk.propsOf(textNode.value ?? mediaNode.value ?? vnode.value) ?? {},
    )
    const mediaProps = computed(() => {
      const node = mediaNode.value

      if (!node) return {}

      const mediaVNode = tk.slotChildrenOf(node, 'media')[0]

      return tk.propsOf(mediaVNode) ?? {}
    })

    const text = computed(() => {
      const value = tk.propsOf(textNode.value).text

      return typeof value === 'string' ? value : ''
    })

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
    const sectionHasMedia = section?.vnode && hasMediaSource(section.media)
    const heroHasMedia = hero?.vnode && hasMediaSource(hero.media)
    const mediaSource = sectionHasMedia
      ? section
      : heroHasMedia
        ? hero
        : section?.vnode
          ? section
          : hero?.vnode
            ? hero
            : null
    const textSource =
      section?.text?.trim() ? section : hero?.text?.trim() ? hero : mediaSource

    if (mediaSource) {
      return {
        props: {
          ...(mediaSource.props ?? {}),
          ...(textSource?.props ?? {}),
        },
        media: mediaSource.media ?? {},
        text: textSource?.text ?? '',
      }
    }

    return {
      props: {},
      media: {},
      text: '',
    }
  })

  return source
}
