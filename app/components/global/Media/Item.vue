<script setup lang="ts">
import { motion, useReducedMotion } from 'motion-v'
import { mediaPreviewClasses } from '~/utils/mediaPreviewClasses'
import { useRevealConfig } from '~/composables/useItemRevealConfig'
import type { RevealResolved } from '~/composables/useItemRevealConfig'

interface SlotNode {
  props?: Record<string, unknown>
}

type MediaType = 'image' | 'video' | 'document' | 'audio' | 'link'

interface MediaProps {
  type: MediaType
  credit?: string
  mediaEmbed?: unknown
  [key: string]: unknown
}

interface SlotsToolkit {
  propsOf(node: SlotNode): MediaProps
}

const props = defineProps<{
  node: SlotNode
  index: number
  overlay?: boolean
  tk: SlotsToolkit
  reveal?: RevealResolved
}>()

const emit = defineEmits<{
  (e: 'open', index: number): void
}>()

const appConfig = useAppConfig()
const theme = appConfig.stirTheme
const mediaProps = computed(() => props.tk.propsOf(props.node))
const isVideo = computed(() => mediaProps.value.type === 'video')
const isDocument = computed(() => mediaProps.value.type === 'document')
const isAudio = computed(() => mediaProps.value.type === 'audio')

const canOpenOverlay = computed(() => !isDocument.value && !isAudio.value)
const openOverlay = () => {
  if (!canOpenOverlay.value) return
  emit('open', props.index)
}

const componentMap: Record<MediaType, string> = {
  image: 'MediaImage',
  video: 'MediaVideo',
  document: 'MediaDocument',
  audio: 'MediaAudio',
  link: 'MediaLink',
}

const { resolved: sharedReveal } = useRevealConfig()
const reveal = computed(() => props.reveal ?? sharedReveal.value)
const revealStartIndex = 0
const revealOnce = computed(() => theme.animations?.once !== false)
const shouldAnimateOnScroll = props.index >= revealStartIndex
const prefersReducedMotion = useReducedMotion()
const revealDelayMs = computed(() =>
  Math.max(0, props.index - revealStartIndex) * Math.max(0, reveal.value.staggerMs),
)
const revealTransition = computed(() => {
  if (prefersReducedMotion.value || !shouldAnimateOnScroll) {
    return { duration: 0 }
  }

  return {
    type: 'tween',
    duration: Math.max(0, reveal.value.durationMs) / 1000,
    ease: reveal.value.ease,
    delay: revealDelayMs.value / 1000,
  }
})
const revealInViewOptions = computed(() => ({
  once: revealOnce.value,
  amount: Math.min(1, Math.max(0, Number(reveal.value.threshold || 0))),
  margin: reveal.value.rootMargin,
}))
const mediaRevealOffsetY = '4rem'
const revealInitial = computed(() => {
  if (prefersReducedMotion.value || !shouldAnimateOnScroll) return false

  return {
    opacity: 0,
    y: mediaRevealOffsetY,
  }
})
const revealWhileInView = computed(() => {
  if (prefersReducedMotion.value || !shouldAnimateOnScroll) return undefined

  return {
    opacity: 1,
    y: 0,
  }
})
</script>

<template>
  <motion.div
    class="media-reveal"
    :in-view-options="revealInViewOptions"
    :initial="revealInitial"
    :transition="revealTransition"
    :while-in-view="revealWhileInView"
  >
    <component
      :is="componentMap[mediaProps.type]"
      v-if="!overlay || isDocument || isAudio"
      v-bind="mediaProps"
    />

    <div
      v-else
      :aria-label="isVideo ? 'Open video modal' : 'Open media modal'"
      class="group relative overflow-hidden"
      :class="[
        theme.media.rounded,
        isVideo || overlay ? 'cursor-pointer' : '',
        isVideo &&
          'grid place-items-center text-white',
        isVideo && mediaPreviewClasses.overlayBase,
        isVideo && mediaPreviewClasses.overlayTint30,
        isVideo && mediaPreviewClasses.overlayInteractiveTint,
      ]"
      role="button"
      tabindex="0"
      @click="openOverlay"
      @keydown.enter.prevent="openOverlay"
      @keydown.space.prevent="openOverlay"
    >
      <div
        :class="[
          'transition-transform',
          isVideo && mediaPreviewClasses.zoomLayer,
          theme.media.effects.scale,
          theme.media.transitions.slow,
          'group-focus-within:scale-105',
        ]"
      >
        <MediaImage v-bind="{ ...mediaProps, hideCredit: true }" />
      </div>

      <span
        v-if="mediaProps.credit"
        :class="[
          'absolute bottom-0 left-0 w-full bg-black/40 px-2 py-1 text-center text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100',
          'group-focus-within:opacity-100',
          theme.media.transitions.fast,
        ]"
      >
        {{ mediaProps.credit }}
      </span>

      <span
        v-if="isVideo"
        aria-hidden="true"
        :class="mediaPreviewClasses.iconLayer"
      >
        <UIcon name="i-lucide-play-circle" size="60" />
      </span>
    </div>
  </motion.div>
</template>
