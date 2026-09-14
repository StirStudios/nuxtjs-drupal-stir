import type { MaybeRefOrGetter } from 'vue'
import { useMounted, usePreferredReducedMotion, useWindowScroll } from '@vueuse/core'

type ParallaxOptions = {
  enabled?: MaybeRefOrGetter<boolean>
  maxOffset?: number
  strength?: number
}

/**
 * Scroll-linked translate for decorative hero visuals. It stays inert during
 * SSR and hydration and whenever the visitor prefers reduced motion.
 */
export function useParallaxStyle(options: ParallaxOptions = {}) {
  const { enabled = true, maxOffset = 112, strength = 0.28 } = options
  const mounted = useMounted()
  const reducedMotion = usePreferredReducedMotion()
  const { y } = useWindowScroll()

  return computed(() => {
    if (!mounted.value || !toValue(enabled) || reducedMotion.value === 'reduce') {
      return undefined
    }

    const offset = Math.min(Math.max(y.value * strength, 0), maxOffset)

    return { transform: `translate3d(0, -${offset}px, 0)` }
  })
}
