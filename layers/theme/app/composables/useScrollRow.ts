import { useScroll } from '@vueuse/core'
import { computed, nextTick, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

/**
 * A row that scrolls sideways (tabs, choice pills on a phone): it fades the
 * edge on whichever side has more, and centres an item by scrolling only the
 * row, never the page. While `enabled` is false it does neither.
 */
export function useScrollRow(
  row: MaybeRefOrGetter<HTMLElement | null | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { arrivedState, measure } = useScroll(row)
  const fade = computed(() =>
    toValue(enabled)
      ? [
          !arrivedState.left && 'mask-l-from-[calc(100%-3rem)]',
          !arrivedState.right && 'mask-r-from-[calc(100%-3rem)]',
        ]
      : [],
  )

  watch(() => [toValue(row), toValue(enabled)], () => nextTick(measure))

  function center(item: HTMLElement | null | undefined) {
    const list = toValue(row)

    if (!toValue(enabled) || !list || !item) return
    list.scrollTo({
      // Measured against the row, whatever the item's offset parent.
      left:
        list.scrollLeft
        + item.getBoundingClientRect().left
        - list.getBoundingClientRect().left
        - (list.clientWidth - item.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }

  return { fade, center }
}
