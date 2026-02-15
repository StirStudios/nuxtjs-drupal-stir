<script setup lang="ts">
import { createSpringLinearEasing } from '../../../utils/animations'

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
const REVEAL_START_INDEX = 6
const shouldAnimateOnScroll = props.index >= REVEAL_START_INDEX
const isRevealed = ref(!shouldAnimateOnScroll)
const revealDurationMs = 550
const revealEasing = createSpringLinearEasing({
  duration: revealDurationMs / 1000,
  stiffness: 250,
  damping: 40,
})
const revealStyle = computed(() =>
  shouldAnimateOnScroll && isRevealed.value
    ? {
        transition: `opacity ${revealDurationMs}ms ${revealEasing}, transform ${revealDurationMs}ms ${revealEasing}`,
      }
    : undefined,
)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!shouldAnimateOnScroll || !rootEl.value) return
  if (!('IntersectionObserver' in window)) {
    isRevealed.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        isRevealed.value = true
        observer?.disconnect()
        observer = null
      }
    },
    { rootMargin: '120px 0px' },
  )

  observer.observe(rootEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
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
    :style="revealStyle"
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

      <template v-if="isVideo">
        <div
          class="absolute inset-0 z-10 bg-black/30 transition-colors group-hover:bg-black/10 group-focus-within:bg-black/10"
        />
        <span
          aria-hidden="true"
          class="absolute inset-0 z-20 flex items-center justify-center text-white"
        >
          <UIcon name="i-lucide-play-circle" size="60" />
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.media-reveal.media-reveal-animated {
  opacity: 0;
  transform: translateY(24px);
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
