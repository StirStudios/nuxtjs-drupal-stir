import { useWindowScroll, useThrottleFn } from '@vueuse/core'
import { usePageContext } from '~/composables/usePageContext'

export function useScrollNav(baseScrollThreshold = 10, directionDelta = 10) {
  if (!import.meta.client) {
    return {
      isScrolled: ref(false),
      scrollDirection: ref(null),
      atBottom: ref(false),
    }
  }

  const { y, directions, arrivedState } = useWindowScroll({
    behavior: 'smooth',
  })

  const { isAdministrator } = usePageContext()
  const adjustedScrollThreshold = computed(() =>
    isAdministrator.value ? baseScrollThreshold + 40 : baseScrollThreshold,
  )

  const lastScrollPosition = ref(0)
  const isScrolled = computed(() => y.value > 50)
  const scrollDirection = ref<'up' | 'down' | null>(null)
  const atBottom = computed(() => arrivedState.bottom)

  const handleScroll = useThrottleFn(() => {
    const current = y.value
    const delta = current - lastScrollPosition.value

    if (current <= adjustedScrollThreshold.value) {
      scrollDirection.value = 'up'
    } else if (delta > directionDelta || directions.bottom) {
      scrollDirection.value = 'down'
    } else if (delta < -directionDelta || directions.top) {
      scrollDirection.value = 'up'
    }

    lastScrollPosition.value = current
  }, 100)

  watch(y, handleScroll, { immediate: true })

  return {
    isScrolled,
    scrollDirection,
    atBottom,
  }
}
