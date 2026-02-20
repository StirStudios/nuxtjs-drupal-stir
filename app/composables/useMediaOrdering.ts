import type { useSlotsToolkit } from '~/composables/useSlotsToolkit'

export function useMediaOrdering(
  slotMedia: Ref<unknown[]>,
  props: { randomize?: boolean },
  tk: ReturnType<typeof useSlotsToolkit>,
) {
  const baseIndices = computed(() => slotMedia.value.map((_, i) => i))

  function computeRandomOrder() {
    const arr = [...baseIndices.value]

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

  const orderedIndices = tk.hydrateOrder(
    () => baseIndices.value,
    () => {
      if (props.randomize) return computeRandomOrder()
      return baseIndices.value
    },
  )

  return {
    baseIndices,
    orderedIndices,
  }
}
