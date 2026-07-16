import type { MaybeRefOrGetter, Ref } from 'vue'

interface DeferredVideoSourceOptions {
  enabled: MaybeRefOrGetter<boolean>
  minWidth: MaybeRefOrGetter<number>
  source: MaybeRefOrGetter<string | undefined>
  strategy: MaybeRefOrGetter<'after-load' | 'immediate'>
  videoElement?: Ref<HTMLVideoElement | null>
}

export function useDeferredVideoSource(options: DeferredVideoSourceOptions) {
  const isActive = ref(false)
  let mediaQuery: MediaQueryList | undefined
  let animationFrame: number | undefined

  async function activate(): Promise<void> {
    if (
      !toValue(options.enabled)
      || isActive.value
      || !toValue(options.source)
    ) {
      return
    }

    isActive.value = true
    await nextTick()
    options.videoElement?.value?.load()
  }

  function activateOnAnimationFrame(): void {
    animationFrame = requestAnimationFrame(() => {
      animationFrame = undefined
      void activate()
    })
  }

  function handleWindowLoad(): void {
    activateOnAnimationFrame()
  }

  function handleMediaQueryChange(event: MediaQueryListEvent): void {
    if (!event.matches) return

    mediaQuery?.removeEventListener('change', handleMediaQueryChange)
    schedule()
  }

  function schedule(): void {
    const minWidth = toValue(options.minWidth)

    if (minWidth > 0) {
      mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`)

      if (!mediaQuery.matches) {
        mediaQuery.addEventListener('change', handleMediaQueryChange)
        return
      }
    }

    if (
      !toValue(options.enabled)
      || toValue(options.strategy) === 'immediate'
    ) {
      void activate()
      return
    }

    if (document.readyState === 'complete') {
      activateOnAnimationFrame()
      return
    }

    window.addEventListener('load', handleWindowLoad, { once: true })
  }

  onMounted(schedule)
  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', handleMediaQueryChange)
    window.removeEventListener('load', handleWindowLoad)

    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
  })

  return { isActive }
}
