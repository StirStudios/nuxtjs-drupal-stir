<script setup lang="ts">
import { motion, useReducedMotion } from 'motion-v'
import { useRevealConfig } from '~/composables/useItemRevealConfig'

type MotionEffectTarget = {
  opacity: number
  x?: number
  y?: number
  scale?: number
  rotateX?: number
  rotateY?: number
}

const config = useAppConfig()
const prefersReducedMotion = useReducedMotion()
const animateOnce = computed(() => config.stirTheme.animations?.once !== false)
const { resolved: reveal } = useRevealConfig()

const hiddenTargets: Record<string, MotionEffectTarget> = {
  'fade-in': { opacity: 0 },
  'fade-up': { opacity: 0, y: 100 },
  'fade-down': { opacity: 0, y: -100 },
  'fade-left': { opacity: 0, x: -100 },
  'fade-right': { opacity: 0, x: 100 },
  'flip-up': { opacity: 0, rotateX: 90 },
  'flip-down': { opacity: 0, rotateX: -90 },
  'flip-left': { opacity: 0, rotateY: -90 },
  'flip-right': { opacity: 0, rotateY: 90 },
  'slide-up': { opacity: 0, y: 100 },
  'slide-down': { opacity: 0, y: -100 },
  'slide-left': { opacity: 0, x: -100 },
  'slide-right': { opacity: 0, x: 100 },
  'zoom-in': { opacity: 0, scale: 0.8 },
  'zoom-out': { opacity: 0, scale: 1.2 },
  'zoom-in-up': { opacity: 0, y: 100, scale: 0.8 },
  'zoom-in-down': { opacity: 0, y: -100, scale: 0.8 },
  'zoom-in-left': { opacity: 0, x: -100, scale: 0.8 },
  'zoom-in-right': { opacity: 0, x: 100, scale: 0.8 },
  'zoom-out-up': { opacity: 0, y: 100, scale: 1.2 },
  'zoom-out-down': { opacity: 0, y: -100, scale: 1.2 },
  'zoom-out-left': { opacity: 0, x: -100, scale: 1.2 },
  'zoom-out-right': { opacity: 0, x: 100, scale: 1.2 },
}

const props = defineProps<{
  effect?: string
  class?: string
  delayMs?: number
}>()

const hiddenTarget = computed<MotionEffectTarget>(
  () =>
    hiddenTargets[props.effect || 'fade-in'] ??
    hiddenTargets['fade-in']!,
)
const visibleTarget = { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0 }
const extraDelaySeconds = computed(() => Math.max(0, props.delayMs ?? 0) / 1000)
const transition = computed(() => ({
  type: 'tween',
  duration: reveal.value.durationMs / 1000,
  ease: reveal.value.ease,
  delay: extraDelaySeconds.value,
}))
const inViewOptions = computed(() => ({
  once: animateOnce.value,
  amount: Math.min(1, Math.max(0, reveal.value.threshold)),
  margin: reveal.value.rootMargin,
}))

const initial = computed(() => {
  if (prefersReducedMotion.value || !props.effect) return false
  return hiddenTarget.value
})
const whileInView = computed(() => {
  if (prefersReducedMotion.value || !props.effect) return undefined
  return visibleTarget
})
</script>

<template>
  <motion.div
    v-if="props.effect"
    :class="props.class"
    :in-view-options="inViewOptions"
    :initial="initial"
    :style="{ transformStyle: props.effect?.startsWith('flip-') ? 'preserve-3d' : undefined }"
    :transition="transition"
    :while-in-view="whileInView"
    v-bind="$attrs"
  >
    <slot />
  </motion.div>

  <slot v-else />
</template>
