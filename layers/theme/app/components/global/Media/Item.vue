<script setup lang="ts">
import { resolveComponent } from 'vue'
import type { Component, VNode } from 'vue'
import type { SlotsToolkit } from '#stir/composables/useSlotsToolkit'
import type { EditAction, EditActionKey } from '#stir/types/EditControls'
import type { NormalizedDrupalMediaNodeProps } from '#stir/types'
import {
  drupalMediaComponentName,
  normalizeDrupalMediaType,
} from '../../../utils/drupalMediaTypes'
import { mediaPreviewClasses } from '#stir/utils/mediaPreviewClasses'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'

type RevealMode = 'default' | 'gallery'

const props = defineProps<{
  node: VNode
  index: number
  deferLoad?: boolean
  direction?: string
  revealMode?: RevealMode
  overlay?: boolean
  editActions?: EditAction[]
  tk: Pick<SlotsToolkit, 'propsOf'>
}>()

const emit = defineEmits<{
  (e: 'open', index: number): void
  (e: 'edit-action-select', key: EditActionKey): void
}>()

const theme = useAppConfig().stirTheme

const mediaProps = computed<NormalizedDrupalMediaNodeProps>(() => {
  const raw = props.tk.propsOf(props.node)

  return {
    ...raw,
    type: normalizeDrupalMediaType(raw.type),
  }
})
const overlayImageProps = computed(() => {
  const { imageClass, ...rest } = mediaProps.value

  return props.deferLoad === true ? { ...rest, deferSource: true } : rest
})
const renderedMediaProps = computed(() =>
  props.deferLoad === true
    ? { ...mediaProps.value, deferSource: true }
    : mediaProps.value,
)
const isVideo = computed(() => mediaProps.value.type === 'video')
const isDocument = computed(() => mediaProps.value.type === 'document')
const isAudio = computed(() => mediaProps.value.type === 'audio')

const openOverlay = () => {
  if (isDocument.value || isAudio.value) return
  emit('open', props.index)
}

const handleOpenOverlayKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ' ') return

  event.preventDefault()
  openOverlay()
}

const handleEditActionSelect = (key: EditActionKey) => {
  emit('edit-action-select', key)
}

const mediaComponent = computed(
  () => resolveComponent(drupalMediaComponentName(mediaProps.value.type)) as Component,
)

const { getRevealMotionProps, getRevealDelayMs, revealMotionKey } =
  useRevealMotionConfig()

const resolvedDelayMs = computed(() =>
  props.revealMode === 'gallery'
    ? getRevealDelayMs(props.index, { mode: 'dense' })
    : getRevealDelayMs(props.index),
)

const revealMotionProps = computed(() =>
  getRevealMotionProps(props.direction, resolvedDelayMs.value, {
    // CSS supplies the motion-safe pre-hydration state; Motion owns the reveal.
    ssrVisible: true,
  }),
)

const animatedMediaMotionProps = computed<Record<string, unknown>>(() => ({
  ...renderedMediaProps.value,
  ...revealMotionProps.value,
  editActions: props.editActions,
  onEditActionSelect: handleEditActionSelect,
}))

const shouldAnimate = computed(() =>
  Boolean((revealMotionProps.value as Record<string, unknown>)?.whileInView),
)
</script>

<template>
  <component
    :is="mediaComponent"
    v-if="(!overlay || isDocument || isAudio) && !shouldAnimate"
    v-bind="renderedMediaProps"
    :edit-actions="editActions"
    @edit-action-select="handleEditActionSelect"
  />

  <RevealMotion
    v-else-if="!overlay || isDocument || isAudio"
    :key="`media-${props.index}-${revealMotionKey}`"
    as-child
    v-bind="animatedMediaMotionProps"
  >
    <component
      :is="mediaComponent"
      class="motion-safe:opacity-0"
      v-bind="renderedMediaProps"
      :edit-actions="editActions"
      @edit-action-select="handleEditActionSelect"
    />
  </RevealMotion>

  <RevealMotion
    v-else
    :key="`media-overlay-${props.index}-${revealMotionKey}`"
    as-child
    v-bind="revealMotionProps"
  >
    <MediaImage
      v-if="!isVideo"
      v-bind="overlayImageProps"
      :aria-label="'Open media modal'"
      class="cursor-pointer"
      :class="{ 'motion-safe:opacity-0': shouldAnimate }"
      :edit-actions="editActions"
      :image-class="[
        'transition-transform',
        theme.media.effects.scale,
        theme.media.transitions.slow,
        'group-focus-within:scale-105',
      ]"
      role="button"
      tabindex="0"
      @click="openOverlay"
      @edit-action-select="handleEditActionSelect"
      @keydown="handleOpenOverlayKeydown"
    />

    <div
      v-else
      aria-label="Open video modal"
      class="group relative overflow-hidden"
      :class="[
        { 'motion-safe:opacity-0': shouldAnimate },
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
      @keydown="handleOpenOverlayKeydown"
    >
      <MediaImage
        v-bind="{ ...mediaProps, hideCredit: true }"
        :edit-actions="editActions"
        :wrapper-class="[
          mediaPreviewClasses.zoomLayer,
          theme.media.transitions.slow,
          theme.media.effects.scale,
          'group-focus-within:scale-105',
        ]"
        @edit-action-select="handleEditActionSelect"
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
  </RevealMotion>
</template>
