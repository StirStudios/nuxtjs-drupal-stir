<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import { useMediaOrdering } from '~/composables/useMediaOrdering'
import { useMediaModal } from '~/composables/useMediaModal'
import { useModalMediaPlayback } from '~/composables/useModalMediaPlayback'
import type { DrupalMediaNodeProps } from '~/types'
import {
  drupalMediaComponentName,
  normalizeDrupalMediaType,
} from '../../../utils/drupalMediaTypes'
import { unrefElement, useElementSize, useWindowSize } from '@vueuse/core'

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

const theme = useAppConfig().stirTheme
const resolvedWidth = computed(() => props.widthClass || props.width || '')

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const slotMedia = computed(() => tk.mediaItems())

type MediaNode = NonNullable<(typeof slotMedia.value)[number]>

function mediaComponentFor(type: unknown) {
  return drupalMediaComponentName(type)
}

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
  startIndex,
  itemsOrdered,
  activeItem,
  modalTitle,
  modalDescription,
  modalCredit,
  modalAccessibleTitle,
  modalAccessibleDescription,
  openModal,
  onSelect: onSelectModal,
} = useMediaModal(slotMediaOrdered, tk)

const portal = useOverlayPortal()
const { width: viewportWidth } = useWindowSize()
const masonryLayoutRoot = ref<ComponentPublicInstance | HTMLElement | null>(
  null,
)
const gridLayoutRoot = ref<ComponentPublicInstance | HTMLElement | null>(null)
const { width: mediaLayoutWidth } = useElementSize(() => {
  if (!import.meta.client) return null

  const masonryElement = unrefElement(masonryLayoutRoot as never) as unknown
  const gridElement = unrefElement(gridLayoutRoot as never) as unknown
  const element = masonryElement ?? gridElement

  return element instanceof HTMLElement || element instanceof SVGElement
    ? element
    : null
})
const resolveLaneCount = (width: number) => {
  const config = props.masonry?.lanes

  if (!config) return 1
  if (width >= 768 && config.md) return config.md
  if (width >= 640 && config.sm) return config.sm
  return config.default ?? 1
}

const gap = computed(() => props.masonry?.gap?.default ?? 16)
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
const lanes = computed(() =>
  resolveLaneCount(
    mediaLayoutWidth.value > 0
      ? mediaLayoutWidth.value
      : viewportWidth.value > 0
        ? viewportWidth.value
        : import.meta.client
          ? window.innerWidth
          : 0,
  ),
)

const { handleCarouselSelect } = useModalMediaPlayback({
  getCurrentMid: () => String(activeItem.value?.mid ?? ''),
  getActiveMid: (index) => String(itemsOrdered.value[index]?.mid ?? ''),
  onSelect: onSelectModal,
})
const firstItem = computed(() => itemsOrdered.value[0] ?? null)
const singleVideoFrameStyle = computed(() => {
  if (firstItem.value?.type !== 'video') return undefined

  const width = Number(firstItem.value?.width)
  const height = Number(firstItem.value?.height)
  const aspectRatio =
    Number.isFinite(width) && Number.isFinite(height) && height > 0
      ? width / height
      : 16 / 9

  return {
    maxWidth: `min(72rem, calc(100vw - 2rem), calc(80vh * ${aspectRatio}))`,
  }
})

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
        ref="masonryLayoutRoot"
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
        ref="gridLayoutRoot"
        :grid-items="gridItems"
        :spacing="spacing"
        :width="resolvedWidth"
      >
        <MediaItem
          v-for="(node, i) in slotMediaOrdered"
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
      </WrapGrid>
    </WrapDiv>
  </EditLink>

  <LazyUModal
    v-if="overlay && itemsOrdered.length > 0"
    v-model:open="open"
    class="media-modal"
    :close="false"
    :description="modalAccessibleDescription"
    fullscreen
    :portal="portal"
    :title="modalAccessibleTitle"
    :ui="{
      content: 'bg-transparent divide-none p-0',
      header: 'hidden',
    }"
  >
    <template #body>
      <UButton
        class="absolute top-4 right-4 z-10"
        color="neutral"
        icon="i-lucide-x"
        size="lg"
        variant="soft"
        @click="open = false"
      />

      <div
        v-if="itemsOrdered.length === 1 && firstItem"
        class="flex h-full w-full items-center justify-center p-4"
      >
        <div
          :class="
            firstItem.type === 'video'
              ? ['w-full overflow-hidden', theme.media.rounded]
              : 'contents'
          "
          :style="singleVideoFrameStyle"
        >
          <component
            :is="mediaComponentFor(firstItem.type)"
            v-bind="{
              ...firstItem,
              ...(firstItem.type === 'video' ? { deferEmbed: false } : {}),
              ...(firstItem.type === 'image' ? { noWrapper: true } : {}),
            }"
          />
        </div>
      </div>

      <LazyUCarousel
        v-else
        :arrows="itemsOrdered.length > 1"
        :items="itemsOrdered"
        loop
        :next="theme.carousel.arrows?.next"
        :next-icon="theme.carousel.arrows?.nextIcon"
        :prev="theme.carousel.arrows?.prev"
        :prev-icon="theme.carousel.arrows?.prevIcon"
        :start-index="startIndex"
        :ui="{ container: 'items-center h-full' }"
        @select="handleCarouselSelect"
      >
        <template #default="{ item }">
          <div :class="['overflow-hidden', theme.media.rounded]">
            <component
              :is="mediaComponentFor(item.type)"
              :key="item.key"
              class="shadow-2xl"
              v-bind="{
                ...item,
                ...(item.type === 'video' ? { deferEmbed: false } : {}),
                ...(item.type === 'image' ? { noWrapper: true } : {}),
              }"
            />
          </div>
        </template>
      </LazyUCarousel>

      <Transition
        appear
        :enter-active-class="`
          transform transition ease-out delay-150
          ${theme.media.transitions.fast}
        `"
        enter-from-class="translate-y-20 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
      >
        <div
          v-if="
            (theme.mediaModal.title && modalTitle) ||
            (theme.mediaModal.description?.media && modalDescription) ||
            modalCredit
          "
          class="absolute bottom-6 left-1/2 max-w-lg -translate-x-1/2 space-y-1 rounded-lg bg-black/75 px-4 py-3 text-center text-white backdrop-blur-sm"
        >
          <div v-if="theme.mediaModal.title && modalTitle" class="font-semibold">
            {{ modalTitle }}
          </div>

          <div
            v-if="theme.mediaModal.description?.media && modalDescription"
            class="text-sm text-neutral-100"
          >
            {{ modalDescription }}
          </div>

          <div v-if="modalCredit" class="text-xs text-neutral-200 italic">
            {{ modalCredit }}
          </div>
        </div>
      </Transition>
    </template>
  </LazyUModal>
</template>

<style>
@layer components {
  .media-modal [aria-roledescription='carousel'] {
    @apply h-full;

    .overflow-hidden {
      @apply h-full;
    }
  }

  .media-modal img {
    @apply max-h-[80vh] object-contain;
  }
}
</style>
