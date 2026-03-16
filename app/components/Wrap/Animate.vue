<script setup lang="ts">
import {
  createSpringLinearEasing,
  defaultTransitionConfig,
} from '~/utils/animations'

const hiddenTransforms: Record<string, string> = {
  'fade-in': 'none',
  'fade-up': 'translateY(100px)',
  'fade-down': 'translateY(-100px)',
  'fade-left': 'translateX(-100px)',
  'fade-right': 'translateX(100px)',
  'flip-up': 'perspective(1000px) rotateX(90deg)',
  'flip-down': 'perspective(1000px) rotateX(-90deg)',
  'flip-left': 'perspective(1000px) rotateY(-90deg)',
  'flip-right': 'perspective(1000px) rotateY(90deg)',
  'slide-up': 'translateY(100px)',
  'slide-down': 'translateY(-100px)',
  'slide-left': 'translateX(-100px)',
  'slide-right': 'translateX(100px)',
  'zoom-in': 'scale(0.8)',
  'zoom-out': 'scale(1.2)',
  'zoom-in-up': 'translateY(100px) scale(0.8)',
  'zoom-in-down': 'translateY(-100px) scale(0.8)',
  'zoom-in-left': 'translateX(-100px) scale(0.8)',
  'zoom-in-right': 'translateX(100px) scale(0.8)',
  'zoom-out-up': 'translateY(100px) scale(1.2)',
  'zoom-out-down': 'translateY(-100px) scale(1.2)',
  'zoom-out-left': 'translateX(-100px) scale(1.2)',
  'zoom-out-right': 'translateX(100px) scale(1.2)',
}

const springEasing = createSpringLinearEasing(defaultTransitionConfig)
const fallbackEasing = `cubic-bezier(${defaultTransitionConfig.ease.join(', ')})`
const transitionTimingFunction = ref(fallbackEasing)

const observerCallbacks = new WeakMap<HTMLElement, (visible: boolean) => void>()
const observedElements = new Set<HTMLElement>()
let sharedObserver: IntersectionObserver | null = null

function getSharedObserver(): IntersectionObserver | null {
  if (!import.meta.client || !('IntersectionObserver' in window)) return null
  if (sharedObserver) return sharedObserver

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement

        observerCallbacks.get(target)?.(Boolean(entry.isIntersecting))
      }
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px',
    },
  )

  return sharedObserver
}

function observeInView(
  element: HTMLElement,
  onVisibleChange: (visible: boolean) => void,
): () => void {
  const observer = getSharedObserver()

  if (!observer) {
    onVisibleChange(true)
    return () => {}
  }

  observerCallbacks.set(element, onVisibleChange)
  observedElements.add(element)
  observer.observe(element)

  return () => {
    observer.unobserve(element)
    observerCallbacks.delete(element)
    observedElements.delete(element)

    if (observedElements.size === 0 && sharedObserver) {
      sharedObserver.disconnect()
      sharedObserver = null
    }
  }
}

const config = useAppConfig()
const animateOnce = computed(() => config.stirTheme.animations.once !== false)
const props = defineProps<{
  effect?: string
  class?: string
}>()

const root = ref<HTMLElement | null>(null)
const isInView = ref(false)
const hasEntered = ref(false)

const shouldShow = computed(() => {
  if (!props.effect) return true
  if (animateOnce.value && hasEntered.value) return true
  return isInView.value
})

const animationStyle = computed(() => {
  if (!props.effect) return undefined

  const hiddenTransform =
    hiddenTransforms[props.effect] ?? hiddenTransforms['fade-in']

  return {
    opacity: shouldShow.value ? '1' : '0',
    transform: shouldShow.value ? 'none' : hiddenTransform,
    transition: `opacity ${defaultTransitionConfig.duration}s ${transitionTimingFunction.value} ${defaultTransitionConfig.delay}s, transform ${defaultTransitionConfig.duration}s ${transitionTimingFunction.value} ${defaultTransitionConfig.delay}s`,
    willChange: 'opacity, transform',
    transformStyle: props.effect?.startsWith('flip-')
      ? 'preserve-3d'
      : undefined,
  }
})

let stopObserving: (() => void) | null = null

onMounted(() => {
  if (
    typeof CSS !== 'undefined' &&
    CSS.supports('transition-timing-function', 'linear(0, 1)')
  ) {
    transitionTimingFunction.value = springEasing
  }

  if (!props.effect || !root.value) return

  stopObserving = observeInView(root.value, (visible) => {
    isInView.value = visible
    if (visible) {
      hasEntered.value = true
      if (animateOnce.value) {
        stopObserving?.()
        stopObserving = null
      }
    }
  })
})

onBeforeUnmount(() => {
  if (stopObserving) {
    stopObserving()
    stopObserving = null
  }
})
</script>

<template>
  <div
    v-if="props.effect"
    ref="root"
    :class="props.class"
    :style="animationStyle"
    v-bind="$attrs"
  >
    <slot />
  </div>

  <slot v-else />
</template>
