import type { Ref, VNode } from 'vue'
import { computed, ref } from 'vue'
import type { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import type { NormalizedDrupalMediaNodeProps } from '~/types'
import { normalizeDrupalMediaType } from '../utils/drupalMediaTypes'

export type ModalMediaItem = NormalizedDrupalMediaNodeProps & {
  key: string
}

export function useMediaModal(
  slotMedia: Ref<VNode[]>,
  tk: ReturnType<typeof useSlotsToolkit>,
) {
  const open = ref(false)
  const activeIndex = ref(0)
  const startIndex = ref(0)
  const itemsOrdered = computed<ModalMediaItem[]>(() =>
    slotMedia.value.map((vnode, i) => {
      const props = tk.propsOf(vnode) as Record<string, unknown>
      const type = normalizeDrupalMediaType(props.type)
      const mid = typeof props.mid === 'string' ? props.mid : undefined
      const src = typeof props.src === 'string' ? props.src : undefined
      const item: ModalMediaItem = {
        ...props,
        key: mid ?? src ?? `${type}-${i}`,
        type,
      }

      if (type === 'image') {
        const modalSrc = typeof item.modalSrc === 'string' ? item.modalSrc : ''
        const modalSrcset = typeof item.modalSrcset === 'string' ? item.modalSrcset : ''
        const modalSizes = typeof item.modalSizes === 'string' ? item.modalSizes : ''

        if (modalSrc !== '') {
          item.src = modalSrc
        }
        if (modalSrcset !== '') {
          item.srcset = modalSrcset
        }
        if (modalSizes !== '') {
          item.sizes = modalSizes
        }
      }

      return item
    }),
  )

  const activeItem = computed(
    () => itemsOrdered.value[activeIndex.value] ?? null,
  )

  const modalTitle = computed(() => activeItem.value?.title || '')
  const modalDescription = computed(() => {
    const description = activeItem.value?.alt || activeItem.value?.credit || ''

    return description.trim() !== '' ? description : undefined
  })
  const modalCredit = computed(() => activeItem.value?.credit || '')
  const modalAccessibleTitle = computed(
    () => modalTitle.value?.trim() || 'Media preview',
  )
  const modalAccessibleDescription = computed(() => {
    const description = modalDescription.value?.trim()

    if (description) return description
    const credit = modalCredit.value?.trim()

    if (credit) return credit
    return `Preview of ${activeItem.value?.type || 'media'} content`
  })

  const normalizeIndex = (index: number) => {
    const count = itemsOrdered.value.length

    if (count === 0) return 0
    const safeIndex = Number.isFinite(index) ? Math.trunc(index) : 0

    return Math.min(Math.max(safeIndex, 0), count - 1)
  }

  function openModal(index: number) {
    if (itemsOrdered.value.length === 0) return
    const normalizedIndex = normalizeIndex(index)

    startIndex.value = normalizedIndex
    activeIndex.value = normalizedIndex
    open.value = true
  }

  function onSelect(index: number) {
    if (itemsOrdered.value.length === 0) return
    activeIndex.value = normalizeIndex(index)
  }

  return {
    open,
    startIndex,
    itemsOrdered,
    activeItem,
    modalTitle,
    modalDescription,
    modalCredit,
    modalAccessibleTitle,
    modalAccessibleDescription,
    openModal,
    onSelect,
  }
}
