<script setup lang="ts">
import type { Component, VNode } from 'vue'
import { defineComponent, h } from 'vue'
import type { SlotsToolkit } from '#stir/composables/useSlotsToolkit'
import type { EditAction, EditActionKey } from '#stir/types/EditControls'
import type { NormalizedDrupalMediaNodeProps } from '#stir/types'
import {
  drupalMediaComponentName,
  normalizeDrupalMediaType,
} from '../../../utils/drupalMediaTypes'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import { useRevealMotionScope } from '#stir/composables/useRevealMotionScope'

type RevealMode = 'default' | 'gallery'

const props = defineProps<{
  node: VNode
  index: number
  deferLoad?: boolean
  direction?: string
  revealMode?: RevealMode
  deliveryProfile?: string
  titleDisplay?: string
  overlay?: boolean
  roundedClass?: string
  wrapperClass?: unknown
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
  const explicitDeliveryProfile = typeof raw.deliveryProfile === 'string'
    ? raw.deliveryProfile.trim()
    : ''
  const explicitDeliverySizes = typeof raw.deliverySizes === 'string'
    ? raw.deliverySizes.trim()
    : ''

  return {
    ...raw,
    type: normalizeDrupalMediaType(raw.type),
    deliveryProfile: explicitDeliverySizes
      ? explicitDeliveryProfile
      : props.deliveryProfile || explicitDeliveryProfile,
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
const visibleTitle = computed(() =>
  ['below', 'over'].includes(props.titleDisplay || '')
  && ['image', 'video'].includes(mediaProps.value.type)
  && typeof mediaProps.value.title === 'string'
    ? mediaProps.value.title.trim()
    : '',
)
// Keep captions clear of inline video playback controls.
const TitleFrame = defineComponent({
  setup(_, { slots }) {
    return () => visibleTitle.value
      ? h('figure', { class: ['media-titled', props.roundedClass || theme.media.rounded] }, slots.default?.())
      : slots.default?.()
  },
})

const titleOverPreview = computed(() => props.titleDisplay === 'over'
  && (mediaProps.value.type === 'image' || props.overlay))

const isVideo = computed(() => mediaProps.value.type === 'video')
const isDocument = computed(() => mediaProps.value.type === 'document')
const isAudio = computed(() => mediaProps.value.type === 'audio')

const openOverlay = () => {
  if (isDocument.value || isAudio.value) return
  emit('open', props.index)
}

const handleEditActionSelect = (key: EditActionKey) => {
  emit('edit-action-select', key)
}

const mediaComponent = computed(
  () => resolveComponent(drupalMediaComponentName(mediaProps.value.type)) as Component,
)

const { getRevealMotionProps, getRevealDelayMs, revealMotionKey } =
  useRevealMotionConfig()
const { effect, staggerIndex } = useRevealMotionScope(() => props.direction)

const resolvedDelayMs = computed(() =>
  getRevealDelayMs(staggerIndex.value)
  + (props.revealMode === 'gallery'
    ? getRevealDelayMs(props.index, { mode: 'dense' })
    : getRevealDelayMs(props.index)),
)

const revealMotionProps = computed(() =>
  getRevealMotionProps(effect.value, resolvedDelayMs.value, {
    // CSS supplies the motion-safe pre-hydration state; Motion owns the reveal.
    ssrVisible: true,
  }),
)

const visualRoundedClass = computed(() =>
  isDocument.value || isAudio.value ? undefined : props.roundedClass,
)

const shouldAnimate = computed(() =>
  Boolean((revealMotionProps.value as Record<string, unknown>)?.whileInView),
)
</script>

<template>
  <TitleFrame>
  <component
    :is="mediaComponent"
    v-if="(!overlay || isDocument || isAudio) && !shouldAnimate"
    v-bind="renderedMediaProps"
    :edit-actions="editActions"
    :rounded-class="visualRoundedClass"
    :wrapper-class="wrapperClass"
    @edit-action-select="handleEditActionSelect"
  />

  <RevealMotion
    v-else-if="!overlay || isDocument || isAudio"
    :key="`media-${props.index}-${revealMotionKey}`"
    class="motion-safe:opacity-0"
    v-bind="revealMotionProps"
  >
    <component
      :is="mediaComponent"
      v-bind="renderedMediaProps"
      :edit-actions="editActions"
      :rounded-class="visualRoundedClass"
      :wrapper-class="wrapperClass"
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
      v-bind="{ ...overlayImageProps, link: undefined, hideCredit: isVideo }"
      :class="{ 'motion-safe:opacity-0': shouldAnimate }"
      :edit-actions="editActions"
      :image-class="[
        theme.media.transitions.slow,
        theme.media.effects.scale,
        'group-focus-within:scale-105',
      ]"
      :is-hero="false"
      :no-wrapper="false"
      :rounded-class="visualRoundedClass"
      :wrapper-class="wrapperClass"
      @edit-action-select="handleEditActionSelect"
    >
      <template #overlay>
        <span
          v-if="isVideo && mediaProps.credit"
          :class="[
            'absolute bottom-0 left-0 w-full bg-black/40 px-2 py-1 text-center text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100',
            'group-focus-within:opacity-100',
            theme.media.transitions.fast,
          ]"
        >
          {{ mediaProps.credit }}
        </span>

        <button
          :aria-label="isVideo ? 'Open video modal' : 'Open media modal'"
          class="absolute inset-0 z-20 grid cursor-pointer place-items-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          type="button"
          @click="openOverlay"
        >
          <MediaPlayIndicator v-if="isVideo" />
        </button>
      </template>
    </MediaImage>
  </RevealMotion>
    <figcaption v-if="visibleTitle" class="media-item-title" :class="{ 'media-item-title--over': titleOverPreview }">{{ visibleTitle }}</figcaption>
  </TitleFrame>
</template>

<style>
.media-titled { position: relative; margin: 0; min-width: 0; }
.media-item-title { margin-block-start: 0.75rem; overflow-wrap: anywhere; }
.media-item-title--over {
  position: absolute;
  inset-inline-start: 1rem;
  bottom: 1rem;
  width: fit-content;
  max-width: calc(100% - 2rem);
  text-align: start;
  z-index: 10;
  margin: 0;
  padding: 0.5rem 0.75rem;
  color: white;
  background: rgb(0 0 0 / 65%);
  border-radius: var(--ui-radius, 0.25rem);
  pointer-events: none;
}
</style>
