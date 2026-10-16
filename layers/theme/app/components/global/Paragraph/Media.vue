<script setup lang="ts">
import { useSlotsToolkit } from '#stir/composables/useSlotsToolkit'
import { useMediaModal } from '#stir/composables/useMediaModal'
import type { DrupalMediaNodeProps } from '#stir/types'
import { normalizeDrupalMediaType } from '../../../utils/drupalMediaTypes'
import { resolveStableMediaDeliveryProfile } from '../../../utils/imageDelivery'
import { maxGridColumns, resolveAlignClasses, type AlignConfig, type GridConfig } from '../../../utils/gridClasses'
import { useLeadMedia } from '#stir/composables/useLeadMedia'
import { masonryGridStyle, masonryItemStyles } from '../../../utils/masonryLayout'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  gridItems?: GridConfig
  spacing?: string
  width?: string
  widthClass?: string
  cornerStyle?: 'default' | 'square' | string
  titleDisplay?: string
  mediaHeight?: 'natural' | 'small' | 'break' | 'feature' | string
  align?: AlignConfig
  direction?: string
  overlay?: boolean

  masonry?: {
    lanes?: Record<string, number>
    gap?: Record<string, number>
  }

  label?: string

  editLink?: string
}>()

const resolvedWidth = computed(() => props.widthClass || props.width || '')
const alignClasses = computed(() => resolveAlignClasses(props.align))
const theme = useAppConfig().stirTheme
const mediaHeightClass = computed(() =>
  theme.media.heights?.[props.mediaHeight || 'natural']
  || theme.media.heights?.natural
  || '',
)
const roundedClass = computed(() =>
  props.cornerStyle === 'square' ? 'rounded-none' : undefined,
)
const overlayEnabled = computed(() => props.overlay === true)

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const slotMedia = computed(() => tk.mediaItems())

type MediaNode = NonNullable<(typeof slotMedia.value)[number]>

const getMediaItemKey = (node: MediaNode, index: number) => {
  const data = tk.propsOf<DrupalMediaNodeProps>(node)
  const candidates = [data.uuid, data.id, data.mid, data.url, data.src]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) return candidate
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return String(candidate)
    }
  }

  return `media-${index}`
}

const {
  open,
  activeIndex,
  startIndex,
  itemsOrdered,
  openModal,
  onSelect: onSelectModal,
} = useMediaModal(slotMedia, tk)

const isImageGallery = computed(
  () =>
    slotMedia.value.length > 1 &&
    slotMedia.value.every(
      (node) => normalizeDrupalMediaType(tk.propsOf(node).type) === 'image',
    ),
)
const isVisualGallery = computed(
  () =>
    slotMedia.value.length > 1 &&
    slotMedia.value.every((node) => {
      const type = normalizeDrupalMediaType(tk.propsOf(node).type)

      return type === 'image' || type === 'video'
    }),
)

const revealMode = computed<'default' | 'gallery'>(() =>
  isVisualGallery.value ? 'gallery' : 'default',
)
// Masonry lanes size images like grid columns.
const layoutGrid = computed<GridConfig | undefined>(() => {
  if (!props.masonry) return props.gridItems

  // Masonry gaps are pixels; grid gaps are Tailwind spacing steps (4px).
  const gap = Object.fromEntries(Object.entries(props.masonry.gap ?? { default: 16 })
    .map(([breakpoint, pixels]) => [breakpoint, Math.round(pixels / 4)]))

  return { columns: props.masonry.lanes ?? { default: 1 }, gap } as GridConfig
})
const deliveryProfile = computed(() =>
  resolveStableMediaDeliveryProfile(layoutGrid.value, false),
)
// The first row of the page's first media paragraph is the likely LCP: those
// images load eagerly without a reveal, and everything after stays lazy.
const isLead = useLeadMedia(props.uuid ?? props.id)
const leadCount = computed(() =>
  isLead ? Math.min(Math.max(maxGridColumns(layoutGrid.value), 1), 4) : 0,
)
// Masonry needs natural-height images and media without captions below, as
// each item's rows come from its aspect ratio; anything else is a plain grid.
const masonryStyles = computed(() =>
  props.masonry && isVisualGallery.value && props.titleDisplay !== 'below'
  && (props.mediaHeight || 'natural') === 'natural'
    ? masonryItemStyles(slotMedia.value.map(node => tk.propsOf<DrupalMediaNodeProps>(node)), props.masonry)
    : undefined,
)
</script>

<template>
  <EditLink
    :id="id"
    v-slot="{ actions, selectAction }"
    controls-placement="slot"
    :link="editLink"
    :parent-uuid="parentUuid"
  >
    <WrapDiv :align="alignClasses">
      <div v-if="masonryStyles" class="@container w-full">
        <div class="media-masonry" :style="masonryGridStyle(props.masonry ?? {})">
          <div
            v-for="(node, i) in slotMedia"
            :key="getMediaItemKey(node, i)"
            :class="roundedClass || theme.media.rounded"
            :style="masonryStyles[i]"
          >
            <LazyMediaItem
              :defer-load="isImageGallery && i >= 4"
              :delivery-profile="deliveryProfile"
              :direction="direction"
              :edit-actions="i === 0 ? actions : undefined"
              :hydrate-on-visible="{ rootMargin: '200px' }"
              :index="i"
              :lead="i < leadCount"
              :node="node"
              :overlay="overlayEnabled"
              :reveal-mode="revealMode"
              :rounded-class="roundedClass"
              :title-display="titleDisplay"
              :tk="tk"
              :wrapper-class="mediaHeightClass"
              @edit-action-select="selectAction"
              @open="openModal"
            />
          </div>
        </div>
      </div>

      <WrapGrid
        v-else
        :grid-items="layoutGrid"
        :spacing="spacing"
        :width="resolvedWidth"
      >
        <MediaItem
          v-for="(node, i) in slotMedia"
          :key="getMediaItemKey(node, i)"
          :defer-load="isImageGallery && i >= 4"
          :delivery-profile="deliveryProfile"
          :direction="direction"
          :edit-actions="
            i === 0 ? actions : undefined
          "
          :index="i"
          :lead="i < leadCount"
          :node="node"
          :overlay="overlayEnabled"
          :reveal-mode="revealMode"
          :rounded-class="roundedClass"
          :title-display="titleDisplay"
          :tk="tk"
          :wrapper-class="mediaHeightClass"
          @edit-action-select="selectAction"
          @open="openModal"
        />
      </WrapGrid>
    </WrapDiv>
  </EditLink>

  <ParagraphMediaModal
    v-if="overlayEnabled && itemsOrdered.length > 0"
    v-model:open="open"
    :active-index="activeIndex"
    :items="itemsOrdered"
    :start-index="startIndex"
    @select="onSelectModal"
  />
</template>
