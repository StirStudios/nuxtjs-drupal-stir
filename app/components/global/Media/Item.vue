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

const { getRevealMotionProps, getStaggerDelayMs } = useRevealMotionConfig()
const isGalleryReveal = computed(() => props.revealMode === 'gallery')
const galleryInitialVisibleCount = 6
const skipInitialGalleryReveal = computed(() =>
  isGalleryReveal.value &&
  mediaProps.value.type === 'image' &&
  props.index < galleryInitialVisibleCount,
)
const mediaComponentProps = computed(() =>
  skipInitialGalleryReveal.value
    ? {
        ...mediaProps.value,
        loading: 'eager',
        ...(props.index === 0 ? { fetchpriority: 'high' } : {}),
      }
    : mediaProps.value,
)
const rawDirection = computed(() =>
  typeof props.direction === 'string'
    ? props.direction.trim().toLowerCase()
    : '',
)
const usesExplicitDirection = computed(() =>
  Boolean(
    rawDirection.value &&
    !['none', 'off', 'unset', 'false', '0'].includes(rawDirection.value),
  ),
)
const effectDirection = computed(() => {
  if (skipInitialGalleryReveal.value) return undefined
  if (usesExplicitDirection.value) return rawDirection.value

  return isGalleryReveal.value ? 'fade-in' : undefined
})

const galleryStaggerMs = 28
const galleryStaggerGroup = 6

const resolvedDelayMs = computed(() =>
  isGalleryReveal.value && !skipInitialGalleryReveal.value
    ? (props.index % galleryStaggerGroup) * galleryStaggerMs
    : getStaggerDelayMs(props.index),
)

const revealMotionProps = computed(() => {
  const base = getRevealMotionProps(effectDirection.value, resolvedDelayMs.value)

  return base
})

const shouldAnimate = computed(
  () =>
    typeof revealMotionProps.value === 'object' &&
    revealMotionProps.value !== null &&
    'whileInView' in revealMotionProps.value,
)
</script>

<template>
  <component
    :is="componentMap[mediaProps.type]"
    v-if="(!overlay || isDocument || isAudio) && !shouldAnimate"
    v-bind="mediaComponentProps"
  />

  <Motion
    v-else-if="!overlay || isDocument || isAudio"
    as-child
    v-bind="revealMotionProps"
  >
    <component :is="componentMap[mediaProps.type]" v-bind="mediaComponentProps" />
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
        <MediaImage v-bind="{ ...mediaComponentProps, hideCredit: true }" />
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
