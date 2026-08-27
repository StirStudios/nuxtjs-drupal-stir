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
  let reducedMotionQuery: MediaQueryList | undefined
  let widthQuery: MediaQueryList | undefined
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

  function deactivate(): void {
    if (!isActive.value) return

    isActive.value = false
    options.videoElement?.value?.pause()
    void nextTick(() => options.videoElement?.value?.load())
  }

  function isEligible(): boolean {
    return reducedMotionQuery?.matches !== true
      && widthQuery?.matches !== false
  }

  function scheduleActivation(): void {
    if (!isEligible()) {
      deactivate()
      return
    }

    window.removeEventListener('load', handleWindowLoad)

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

  function handleEligibilityChange(): void {
    scheduleActivation()
  }

  onMounted(() => {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionQuery.addEventListener('change', handleEligibilityChange)

    const minWidth = toValue(options.minWidth)

    if (minWidth > 0) {
      widthQuery = window.matchMedia(`(min-width: ${minWidth}px)`)
      widthQuery.addEventListener('change', handleEligibilityChange)
    }

    scheduleActivation()
  })
  onBeforeUnmount(() => {
    reducedMotionQuery?.removeEventListener('change', handleEligibilityChange)
    widthQuery?.removeEventListener('change', handleEligibilityChange)
    window.removeEventListener('load', handleWindowLoad)

    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
  })

  return { isActive }
}
