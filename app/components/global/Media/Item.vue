<script setup lang="ts">
import { Motion } from 'motion-v'
import { mediaPreviewClasses } from '~/utils/mediaPreviewClasses'
import { useRevealMotionConfig } from '~/composables/useRevealMotionConfig'

interface SlotNode {
  props?: Record<string, unknown>
}

type MediaType = 'image' | 'video' | 'document' | 'audio' | 'link'
type RevealMode = 'default' | 'gallery'

interface MediaProps {
  type: MediaType
  credit?: string
  mediaEmbed?: unknown
  loading?: 'lazy' | 'eager'
  fetchpriority?: 'high' | 'auto' | 'low'
  [key: string]: unknown
}

interface SlotsToolkit {
  propsOf(node: SlotNode): MediaProps
}

const props = defineProps<{
  node: SlotNode
  index: number
  direction?: string
  revealMode?: RevealMode
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

const openOverlay = () => {
  if (isDocument.value || isAudio.value) return
  emit('open', props.index)
}

const componentMap: Record<MediaType, string> = {
  image: 'MediaImage',
  video: 'MediaVideo',
  document: 'MediaDocument',
  audio: 'MediaAudio',
  link: 'MediaLink',
}

const { getRevealMotionProps, getRevealDelayMs, revealMotionKey } = useRevealMotionConfig()
const effectDirection = computed(() => {
  const direction =
    typeof props.direction === 'string'
      ? props.direction.trim().toLowerCase()
      : ''

  if (!direction || ['none', 'off', 'unset', 'false', '0'].includes(direction)) {
    return undefined
  }

  return direction
})

const resolvedDelayMs = computed(() =>
  props.revealMode === 'gallery'
    ? getRevealDelayMs(props.index, { mode: 'dense' })
    : getRevealDelayMs(props.index),
)

const revealMotionProps = computed(() =>
  getRevealMotionProps(effectDirection.value, resolvedDelayMs.value, {
    ssrVisible: true,
  }),
)

const shouldAnimate = computed(() =>
  Boolean((revealMotionProps.value as Record<string, unknown>)?.whileInView),
)
</script>

<template>
  <component
    :is="componentMap[mediaProps.type]"
    v-if="(!overlay || isDocument || isAudio) && !shouldAnimate"
    v-bind="mediaProps"
  />

  <Motion
    v-else-if="!overlay || isDocument || isAudio"
    :key="`media-${props.index}-${revealMotionKey}`"
    as-child
    v-bind="revealMotionProps"
  >
    <component :is="componentMap[mediaProps.type]" v-bind="mediaProps" />
  </Motion>

  <Motion
    v-else
    :key="`media-overlay-${props.index}-${revealMotionKey}`"
    as-child
    v-bind="revealMotionProps"
  >
    <MediaImage
      v-if="!isVideo"
      v-bind="mediaProps"
      :aria-label="'Open media modal'"
      class="cursor-pointer"
      :image-class="[
        'transition-transform',
        theme.media.effects.scale,
        theme.media.transitions.slow,
        'group-focus-within:scale-105',
      ]"
      role="button"
      tabindex="0"
      @click="openOverlay"
      @keydown.enter.prevent="openOverlay"
      @keydown.space.prevent="openOverlay"
    />

    <div
      v-else
      aria-label="Open video modal"
      class="group relative overflow-hidden"
      :class="[
        theme.media.rounded,
        'cursor-pointer',
        'grid place-items-center text-white',
        mediaPreviewClasses.overlayBase,
        mediaPreviewClasses.overlayTint30,
        mediaPreviewClasses.overlayInteractiveTint,
      ]"
      role="button"
      tabindex="0"
      @click="openOverlay"
      @keydown.enter.prevent="openOverlay"
      @keydown.space.prevent="openOverlay"
    >
      <MediaImage
        v-bind="{ ...mediaProps, hideCredit: true }"
        :wrapper-class="[
          mediaPreviewClasses.zoomLayer,
          theme.media.transitions.slow,
          theme.media.effects.scale,
          'group-focus-within:scale-105',
        ]"
      />

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

      <span aria-hidden="true" :class="mediaPreviewClasses.iconLayer">
        <UIcon name="i-lucide-play-circle" size="60" />
      </span>
    </div>
  </Motion>
</template>
