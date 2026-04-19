<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { createSpringLinearEasing } from '../../../utils/animations'
import { mediaPreviewClasses } from '~/utils/mediaPreviewClasses'
import { useItemRevealConfig } from '~/composables/useItemRevealConfig'
import type { ItemRevealResolved } from '~/composables/useItemRevealConfig'

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
  itemReveal?: ItemRevealResolved
}>()

const emit = defineEmits<{
  (e: 'open', index: number): void
}>()

const theme = useAppConfig().stirTheme
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

const rootEl = ref<HTMLElement | null>(null)
const { resolved: sharedItemReveal } = useItemRevealConfig()
const reveal = computed(() => props.itemReveal ?? sharedItemReveal.value)
const revealStartIndex = 0
const revealOnce = false
const shouldAnimateOnScroll = props.index >= revealStartIndex
const isRevealed = ref(!shouldAnimateOnScroll)
const revealEasing = computed(() =>
  createSpringLinearEasing({
    duration: reveal.value.durationMs / 1000,
    stiffness: 250,
    damping: 40,
  }),
)
const revealBaseStyle = computed(() => ({
  '--media-reveal-offset-y': reveal.value.offsetY,
}))
const revealStyle = computed(() => {
  if (!shouldAnimateOnScroll) return undefined

  return {
    transition: `opacity ${reveal.value.durationMs}ms ${revealEasing.value}, transform ${reveal.value.durationMs}ms ${revealEasing.value}`,
    transitionDelay: `${Math.max(0, props.index - revealStartIndex) * Math.max(0, reveal.value.staggerMs)}ms`,
  }
})
let stopObserver: (() => void) | null = null
let rafId: number | null = null

function startRevealObserver() {
  if (!rootEl.value) return

  const { stop } = useIntersectionObserver(
    rootEl,
    (entries) => {
      const isIntersecting = entries.some((entry) => entry.isIntersecting)

      if (isIntersecting) {
        isRevealed.value = true

        if (revealOnce) {
          stopObserver?.()
          stopObserver = null
        }
        return
      }

      if (!revealOnce) {
        isRevealed.value = false
      }
    },
    {
      threshold: reveal.value.threshold,
      rootMargin: reveal.value.rootMargin,
    },
  )

  stopObserver = stop
}

onMounted(() => {
  if (!shouldAnimateOnScroll || !rootEl.value) return
  if (!('IntersectionObserver' in window)) {
    isRevealed.value = true
    return
  }

  // Let initial hidden styles paint first so staggered transitions are visible
  // for media already in the first viewport.
  rafId = requestAnimationFrame(() => {
    startRevealObserver()
    rafId = null
  })
})

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  stopObserver?.()
  stopObserver = null
})
</script>

<template>
  <div
    ref="rootEl"
    :class="[
      'media-reveal',
      shouldAnimateOnScroll && 'media-reveal-animated',
      isRevealed && 'media-reveal-visible',
    ]"
    :style="[revealBaseStyle, revealStyle]"
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
  </div>
</template>

<style scoped>
.media-reveal.media-reveal-animated {
  opacity: 0;
  transform: translateY(var(--media-reveal-offset-y, 4rem));
}

.media-reveal.media-reveal-animated.media-reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .media-reveal.media-reveal-animated {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
