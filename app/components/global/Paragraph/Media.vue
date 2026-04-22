<script setup lang="ts">
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import { useMediaOrdering } from '~/composables/useMediaOrdering'
import { useMediaModal } from '~/composables/useMediaModal'
import { useModalMediaPlayback } from '~/composables/useModalMediaPlayback'
import { useElementSize } from '@vueuse/core'

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

const scrollArea = ref<{ $el?: HTMLElement } | null>(null)
const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const theme = useAppConfig().stirTheme
const slotMedia = computed(() => tk.mediaItems())
const componentMap: Record<string, string> = {
  image: 'MediaImage',
  video: 'MediaVideo',
  document: 'MediaDocument',
  audio: 'MediaAudio',
  link: 'MediaLink',
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
const { width: scrollWidth } = useElementSize(() => scrollArea.value?.$el)
const lanes = computed(() => {
  const config = props.masonry?.lanes

  if (!config) return 1
  if (scrollWidth.value >= 768 && config.md) return config.md
  if (scrollWidth.value >= 640 && config.sm) return config.sm
  return config.default ?? 1
})

const gap = computed(() => props.masonry?.gap?.default ?? 16)
const hydrated = ref(false)
const useMasonryVirtualized = computed(() => Boolean(props.masonry && hydrated.value))
const { handleCarouselSelect } = useModalMediaPlayback({
  getCurrentMid: () => String(activeItem.value?.mid ?? ''),
  getActiveMid: (index) => String(itemsOrdered.value[index]?.mid ?? ''),
  onSelect: onSelectModal,
})

onMounted(() => {
  hydrated.value = true
})
</script>

<template>
  <EditLink :link="editLink" :parent-uuid="parentUuid">
    <WrapAlign :align="align">
      <component :is="headerTag || 'h2'" v-if="header">
        {{ header }}
      </component>

      <UScrollArea
        v-if="useMasonryVirtualized"
        ref="scrollArea"
        v-slot="{ item: node, index: i }"
        class="w-full overflow-hidden"
        :items="slotMediaOrdered"
        :virtualize="{ lanes, gap, estimateSize: 480 }"
      >
        <MediaItem
          :direction="direction"
          :index="i"
          :node="node"
          :overlay="overlay"
          :tk="tk"
          @open="openModal"
        />
      </UScrollArea>

      <WrapGrid
        v-else
        :grid-items="gridItems"
        :spacing="spacing"
        :width="resolvedWidth"
      >
        <MediaItem
          v-for="(node, i) in slotMediaOrdered"
          :key="i"
          :direction="direction"
          :index="i"
          :node="node"
          :overlay="overlay"
          :tk="tk"
          @open="openModal"
        />
      </WrapGrid>
    </WrapAlign>
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
        class="flex h-full items-center justify-center"
      >
        <div class="w-full">
          <component
            :is="componentMap[itemsOrdered[0].type]"
            v-bind="{
              ...itemsOrdered[0],
              ...(itemsOrdered[0].type === 'video' ? { deferEmbed: false } : {}),
              ...(itemsOrdered[0].type === 'image' ? { noWrapper: true } : {}),
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
