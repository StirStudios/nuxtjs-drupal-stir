<script setup lang="ts">
import { useSlotsToolkit } from '#stir/composables/useSlotsToolkit'
import { useMediaOrdering } from '#stir/composables/useMediaOrdering'
import { useMediaModal } from '#stir/composables/useMediaModal'
import type { DrupalMediaNodeProps } from '#stir/types'
import { normalizeDrupalMediaType } from '../../../utils/drupalMediaTypes'
import { resolveResponsiveGridValue } from '../../../utils/responsiveGrid'
import { useWindowSize } from '@vueuse/core'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  gridItems?: string
  spacing?: string
  width?: string
  widthClass?: string
  align?: string
  direction?: string
  overlay?: boolean
  randomize?: boolean

  masonry?: {
    lanes?: Record<string, number>
    gap?: Record<string, number>
  }

  label?: string
  header?: string
  headerTag?: string

  editLink?: string
}>()

const resolvedWidth = computed(() => props.widthClass || props.width || '')

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

const { orderedIndices } = useMediaOrdering(slotMedia, props, tk)
const slotMediaOrdered = computed(() =>
  orderedIndices.value
    .map((i) => slotMedia.value[i])
    .filter(
      (item): item is NonNullable<(typeof slotMedia.value)[number]> => !!item,
    ),
)

const {
  open,
  activeIndex,
  startIndex,
  itemsOrdered,
  openModal,
  onSelect: onSelectModal,
} = useMediaModal(slotMediaOrdered, tk)

const { width: viewportWidth } = useWindowSize()
const gap = computed(() => resolveResponsiveGridValue(
  props.masonry?.gap,
  viewportWidth.value,
  16,
))
const isImageGallery = computed(
  () =>
    slotMediaOrdered.value.length > 1 &&
    slotMediaOrdered.value.every(
      (node) => normalizeDrupalMediaType(tk.propsOf(node).type) === 'image',
    ),
)
const isVisualGallery = computed(
  () =>
    slotMediaOrdered.value.length > 1 &&
    slotMediaOrdered.value.every((node) => {
      const type = normalizeDrupalMediaType(tk.propsOf(node).type)

      return type === 'image' || type === 'video'
    }),
)

const hydrated = ref(false)
const revealMode = computed<'default' | 'gallery'>(() =>
  isVisualGallery.value ? 'gallery' : 'default',
)
const lanes = computed(() => resolveResponsiveGridValue(
  props.masonry?.lanes,
  viewportWidth.value,
  1,
))

onMounted(() => {
  hydrated.value = true
})
</script>

<template>
  <EditLink
    v-slot="{ actions, selectAction }"
    controls-placement="slot"
    :link="editLink"
    :parent-uuid="parentUuid"
  >
    <WrapDiv :align="align">
      <component :is="headerTag || 'h2'" v-if="header">
        {{ header }}
      </component>

      <LazyUScrollArea
        v-if="props.masonry && hydrated"
        v-slot="{ item: node, index: i }"
        class="w-full overflow-hidden"
        :items="slotMediaOrdered"
        :virtualize="{
          lanes,
          gap,
          estimateSize: isImageGallery ? 260 : 480,
          overscan: isImageGallery ? 24 : 8,
        }"
      >
        <MediaItem
          :key="getMediaItemKey(node, i)"
          :direction="direction"
          :edit-actions="
            i === 0 ? actions : undefined
          "
          :index="i"
          :node="node"
          :overlay="overlay"
          :reveal-mode="revealMode"
          :tk="tk"
          @edit-action-select="selectAction"
          @open="openModal"
        />
      </LazyUScrollArea>

      <WrapGrid
        v-else
        :grid-items="gridItems"
        :spacing="spacing"
        :width="resolvedWidth"
      >
        <MediaItem
          v-for="(node, i) in slotMediaOrdered"
          :key="getMediaItemKey(node, i)"
          :defer-load="isImageGallery && i >= 4"
          :direction="direction"
          :edit-actions="
            i === 0 ? actions : undefined
          "
          :index="i"
          :node="node"
          :overlay="overlay"
          :reveal-mode="revealMode"
          :tk="tk"
          @edit-action-select="selectAction"
          @open="openModal"
        />
      </WrapGrid>
    </WrapDiv>
  </EditLink>

  <ParagraphMediaModal
    v-if="overlay && itemsOrdered.length > 0"
    v-model:open="open"
    :active-index="activeIndex"
    :items="itemsOrdered"
    :start-index="startIndex"
    @select="onSelectModal"
  />
</template>
