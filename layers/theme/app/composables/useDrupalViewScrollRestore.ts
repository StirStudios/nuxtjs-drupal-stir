import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

interface DrupalViewScrollRestoreProps {
  displayId?: string
  parentUuid?: string
  restoreScrollLinkPattern?: string
  viewId?: string
}

interface UseDrupalViewScrollRestoreOptions {
  currentPage: Ref<number>
  viewRoot: Readonly<Ref<HTMLElement | null>>
}

export function useDrupalViewScrollRestore(
  props: DrupalViewScrollRestoreProps,
  options: UseDrupalViewScrollRestoreOptions,
) {
  const route = useRoute()
  const restoredScrollPosition = ref(false)
  const isHistoryNavigation = ref(false)
  const restoreTargetKey = 'stir:view-scroll-restore-target'

  function scrollStorageKeyFor(fullPath = route.fullPath) {
    return [
      'stir:view-scroll',
      fullPath,
      props.viewId || '',
      props.displayId || '',
      props.parentUuid || '',
    ].join(':')
  }

  function saveScrollPosition(key = scrollStorageKeyFor()) {
    if (!import.meta.client) return

    sessionStorage.setItem(
      key,
      JSON.stringify({
        top: window.scrollY,
        savedAt: Date.now(),
      }),
    )
  }

  function restoreScrollPosition() {
    if (
      !import.meta.client ||
      restoredScrollPosition.value
    ) {
      return
    }

    const shouldRestore =
      isHistoryNavigation.value ||
      sessionStorage.getItem(restoreTargetKey) === route.fullPath

    if (!shouldRestore) return

    const stored = sessionStorage.getItem(scrollStorageKeyFor())

    if (!stored) return

    try {
      const data = JSON.parse(stored) as { top?: unknown, savedAt?: unknown }
      const top = typeof data.top === 'number' ? data.top : null
      const savedAt = typeof data.savedAt === 'number' ? data.savedAt : 0

      if (top === null || Date.now() - savedAt > 30 * 60 * 1000) {
        sessionStorage.removeItem(scrollStorageKeyFor())
        return
      }

      restoredScrollPosition.value = true
      isHistoryNavigation.value = false
      sessionStorage.removeItem(restoreTargetKey)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top,
            behavior: 'instant',
          })
        })
      })
    }
    catch {
      sessionStorage.removeItem(scrollStorageKeyFor())
    }
  }

  function shouldRestoreScrollForHref(href: string): boolean {
    if (!href.startsWith('/') || href === route.path) return false
    if (!props.restoreScrollLinkPattern) return true

    try {
      return new RegExp(props.restoreScrollLinkPattern).test(href)
    }
    catch {
      return false
    }
  }

  function handleViewClick(event: MouseEvent) {
    if (!import.meta.client) return

    const target = event.target instanceof Element ? event.target : null
    const link = target?.closest('a[href]')
    const href = link?.getAttribute('href') || ''

    if (!shouldRestoreScrollForHref(href)) return

    saveScrollPosition()
    sessionStorage.setItem(restoreTargetKey, route.fullPath)
  }

  function scrollToViewTop() {
    if (!import.meta.client) return

    nextTick(() => {
      options.viewRoot.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  function markHistoryNavigation() {
    isHistoryNavigation.value = true
  }

  function handlePageHide() {
    saveScrollPosition()
  }

  watch(options.currentPage, (value, oldValue) => {
    if (oldValue === undefined || value === oldValue) return

    scrollToViewTop()
  })

  watch(
    () => [route.path, route.fullPath] as const,
    ([path], [oldPath, oldFullPath]) => {
      if (!oldPath || path === oldPath) return

      saveScrollPosition(scrollStorageKeyFor(oldFullPath))
      restoredScrollPosition.value = false

      if (
        isHistoryNavigation.value ||
        sessionStorage.getItem(restoreTargetKey) === route.fullPath
      ) {
        nextTick(restoreScrollPosition)
        return
      }

      scrollToViewTop()
    },
  )

  onMounted(() => {
    restoreScrollPosition()
    useEventListener(window, 'popstate', markHistoryNavigation)
    useEventListener(window, 'pagehide', handlePageHide)
  })

  onBeforeUnmount(() => {
    saveScrollPosition()
  })

  return {
    handleViewClick,
    restoreScrollPosition,
  }
}
