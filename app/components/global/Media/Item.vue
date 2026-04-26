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
  fetchpriority?: 'high' | 'auto'
  [key: string]: unknown
}

interface SlotsToolkit {
  propsOf(node: SlotNode): MediaProps
}

const props = defineProps<{
  node: SlotNode
  index: number
  direction?: string
  initialSkipCount?: number
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

const { getRevealMotionProps, getRevealDelayMs } = useRevealMotionConfig()
const skipInitialGalleryReveal = computed(() =>
  props.revealMode === 'gallery' &&
  mediaProps.value.type === 'image' &&
  props.index < Math.max(0, props.initialSkipCount ?? 4),
)
const effectDirection = computed(() => {
  if (skipInitialGalleryReveal.value) return undefined

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
  props.revealMode === 'gallery' && !skipInitialGalleryReveal.value
    ? getRevealDelayMs(props.index, { mode: 'dense' })
    : getRevealDelayMs(props.index),
)

const mediaRenderProps = computed(() => {
  if (mediaProps.value.type !== 'image') return mediaProps.value
  if (!skipInitialGalleryReveal.value) return mediaProps.value

  return {
    ...mediaProps.value,
    loading: 'eager',
    fetchpriority: mediaProps.value.fetchpriority ?? (props.index === 0 ? 'high' : 'auto'),
  }
})

const revealMotionProps = computed(() =>
  getRevealMotionProps(effectDirection.value, resolvedDelayMs.value),
)

const shouldAnimate = computed(() =>
  Boolean((revealMotionProps.value as Record<string, unknown>)?.whileInView),
)
</script>

<template>
  <component
    :is="componentMap[mediaProps.type]"
    v-if="(!overlay || isDocument || isAudio) && !shouldAnimate"
    v-bind="mediaRenderProps"
  />

  <Motion
    v-else-if="!overlay || isDocument || isAudio"
    as-child
    v-bind="revealMotionProps"
  >
    <component :is="componentMap[mediaProps.type]" v-bind="mediaRenderProps" />
  </Motion>

  <Motion v-else as-child v-bind="revealMotionProps">
    <div
      :aria-label="isVideo ? 'Open video modal' : 'Open media modal'"
      class="group relative overflow-hidden"
      :class="[
        theme.media.rounded,
        isVideo || overlay ? 'cursor-pointer' : '',
        isVideo && 'grid place-items-center text-white',
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
        <MediaImage v-bind="{ ...mediaRenderProps, hideCredit: true }" />
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
  </Motion>
</template>
