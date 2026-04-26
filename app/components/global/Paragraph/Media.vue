<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import { useMediaOrdering } from '~/composables/useMediaOrdering'
import { useMediaModal } from '~/composables/useMediaModal'
import { useModalMediaPlayback } from '~/composables/useModalMediaPlayback'
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
const requestHeaders = useRequestHeaders(['user-agent'])

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const slotMedia = computed(() => tk.mediaItems())

type MediaNode = NonNullable<(typeof slotMedia.value)[number]>

const componentMap: Record<string, string> = {
  image: 'MediaImage',
  video: 'MediaVideo',
  document: 'MediaDocument',
  audio: 'MediaAudio',
  link: 'MediaLink',
}

const getMediaItemKey = (node: MediaNode, index: number) => {
  const data = tk.propsOf(node) as Record<string, unknown>
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
    .filter((item): item is NonNullable<(typeof slotMedia.value)[number]> => !!item),
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
const masonryLayoutRoot = ref<ComponentPublicInstance | HTMLElement | null>(null)
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
const isImageGallery = computed(() =>
  slotMediaOrdered.value.length > 1 &&
  slotMediaOrdered.value.every((node) => tk.propsOf(node).type === 'image'),
)
const isVisualGallery = computed(() =>
  slotMediaOrdered.value.length > 1 &&
  slotMediaOrdered.value.every((node) => {
    const type = tk.propsOf(node).type

    return type === 'image' || type === 'video'
  }),
)

const hydrated = ref(false)
const revealMode = computed<'default' | 'gallery'>(() =>
  isVisualGallery.value ? 'gallery' : 'default',
)
const getSsrEstimatedWidth = (): number => {
  if (!import.meta.server) return 0

  const userAgent = requestHeaders['user-agent'] || ''
  const isLikelyMobile = /Mobile|Android|iPhone|iPod|Windows Phone/i.test(userAgent)

  return isLikelyMobile ? 390 : 1280
}
const getInitialGallerySkipCount = (width: number) => {
  const resolvedWidth = width > 0 ? width : getSsrEstimatedWidth()

  const rows =
    resolvedWidth >= 1024 ? 3
    : resolvedWidth >= 768 ? 4
    : resolvedWidth >= 640 ? 2
    : 1

  const galleryLanes = props.masonry
    ? resolveLaneCount(resolvedWidth)
    : (resolvedWidth >= 768 ? 4 : resolvedWidth >= 640 ? 3 : 1)

  return Math.max(1, galleryLanes) * rows
}
const lanes = computed(() =>
  resolveLaneCount(
    mediaLayoutWidth.value > 0
      ? mediaLayoutWidth.value
      : viewportWidth.value > 0
      ? viewportWidth.value
      : (import.meta.client ? window.innerWidth : getSsrEstimatedWidth()),
  ),
)

const initialGallerySkipCount = useState<number>(
  `media-initial-skip-${props.uuid ?? props.id ?? 'default'}`,
  () => getInitialGallerySkipCount(0),
)
const updateInitialGallerySkipCount = () => {
  if (!import.meta.client) return

  initialGallerySkipCount.value = getInitialGallerySkipCount(
    mediaLayoutWidth.value || viewportWidth.value || window.innerWidth,
  )
}
const { handleCarouselSelect } = useModalMediaPlayback({
  getCurrentMid: () => String(activeItem.value?.mid ?? ''),
  getActiveMid: (index) => String(itemsOrdered.value[index]?.mid ?? ''),
  onSelect: onSelectModal,
})

onMounted(() => {
  hydrated.value = true
  updateInitialGallerySkipCount()
})

watch(
  [viewportWidth, mediaLayoutWidth],
  ([width, layoutWidth]) => {
    if (!import.meta.client || (width <= 0 && layoutWidth <= 0)) return
    updateInitialGallerySkipCount()
  },
)
</script>

<template>
  <EditLink :link="editLink" :parent-uuid="parentUuid">
    <WrapDiv :align="align">
      <component :is="headerTag || 'h2'" v-if="header">
        {{ header }}
      </component>

      <UScrollArea
        v-if="props.masonry && hydrated"
        ref="masonryLayoutRoot"
        v-slot="{ item: node, index: i }"
        class="w-full overflow-hidden"
        :items="slotMediaOrdered"
        :virtualize="{ lanes, gap, estimateSize: isImageGallery ? 260 : 480, overscan: isImageGallery ? 24 : 8 }"
      >
        <MediaItem
          :key="getMediaItemKey(node, i)"
          :direction="direction"
          :index="i"
          :initial-skip-count="initialGallerySkipCount"
          :node="node"
          :overlay="overlay"
          :reveal-mode="revealMode"
          :tk="tk"
          @open="openModal"
        />
      </UScrollArea>

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
          :index="i"
          :initial-skip-count="initialGallerySkipCount"
          :node="node"
          :overlay="overlay"
          :reveal-mode="revealMode"
          :tk="tk"
          @open="openModal"
        />
      </WrapGrid>
    </WrapDiv>
  </EditLink>

  <UModal
    v-model:open="open"
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
        v-if="itemsOrdered.length === 1"
        class="flex h-full w-full items-center justify-center"
      >
        <component
          :is="componentMap[itemsOrdered[0].type]"
          v-bind="{
            ...itemsOrdered[0],
            ...(itemsOrdered[0].type === 'video' ? { deferEmbed: false } : {}),
            ...(itemsOrdered[0].type === 'image' ? { noWrapper: true } : {}),
          }"
        />
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
              :is="componentMap[item.type]"
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
            (theme.modal.title && modalTitle) ||
            (theme.modal.description?.media && modalDescription) ||
            modalCredit
          "
          class="absolute bottom-6 left-1/2 max-w-lg -translate-x-1/2 space-y-1 rounded-lg bg-black/75 px-4 py-3 text-center text-white backdrop-blur-sm"
        >
          <div v-if="theme.modal.title && modalTitle" class="font-semibold">
            {{ modalTitle }}
          </div>

          <div
            v-if="theme.modal.description?.media && modalDescription"
            class="text-sm text-neutral-100"
          >
            {{ modalDescription }}
          </div>

          <div v-if="modalCredit" class="text-xs italic text-neutral-200">
            {{ modalCredit }}
          </div>
        </div>
      </Transition>
    </template>
  </UModal>
</template>

<style>
@layer components {
  [role='dialog'] [aria-roledescription='carousel'],
  [role='dialog'] .overflow-hidden {
    @apply h-full;
  }
  [role='dialog'] img {
    @apply max-h-[80vh] object-contain;
  }
}
</style>
