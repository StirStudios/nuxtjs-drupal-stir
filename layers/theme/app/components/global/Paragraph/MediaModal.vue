<script setup lang="ts">
import { useModalMediaPlayback } from '#stir/composables/useModalMediaPlayback'
import type { ModalMediaItem } from '#stir/composables/useMediaModal'
import { resolveCarouselArrowButton } from '#stir/utils/nuxtUiProps'
import { drupalMediaComponentName } from '../../../utils/drupalMediaTypes'

const props = defineProps<{
  activeIndex: number
  items: ModalMediaItem[]
  startIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const open = defineModel<boolean>('open', { required: true })
const theme = useAppConfig().stirTheme
const portal = useOverlayPortal()
const activeItem = computed(() => props.items[props.activeIndex] ?? null)
const firstItem = computed(() => props.items[0] ?? null)
const modalTitle = computed(() => activeItem.value?.title || '')
const modalDescription = computed(() => {
  const description = activeItem.value?.alt || activeItem.value?.credit || ''

  return description.trim() !== '' ? description : undefined
})
const modalCredit = computed(() => activeItem.value?.credit || '')
const modalAccessibleTitle = computed(
  () => modalTitle.value.trim() || 'Media preview',
)
const modalAccessibleDescription = computed(() => {
  const description = modalDescription.value?.trim()

  if (description) return description
  const credit = modalCredit.value.trim()

  if (credit) return credit
  return `Preview of ${activeItem.value?.type || 'media'} content`
})
const prevCarouselButton = computed(() =>
  resolveCarouselArrowButton(theme.carousel.arrows?.prev),
)
const nextCarouselButton = computed(() =>
  resolveCarouselArrowButton(theme.carousel.arrows?.next),
)

function mediaFrameStyle(item: ModalMediaItem) {
  const width = Number(item.width)
  const height = Number(item.height)
  const hasDimensions =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0

  const aspectRatio =
    hasDimensions
      ? width / height
      : 16 / 9

  return {
    aspectRatio: `${aspectRatio}`,
    width: `min(72rem, calc(100vw - 2rem), calc(80vh * ${aspectRatio}))`,
  }
}

const { handleCarouselSelect } = useModalMediaPlayback({
  getCurrentMid: () => String(activeItem.value?.mid ?? ''),
  getActiveMid: index => String(props.items[index]?.mid ?? ''),
  onSelect: (index) => {
    emit('select', index)
  },
})

function mediaComponentFor(type: unknown) {
  return drupalMediaComponentName(type)
}

function closeModal(): void {
  open.value = false
}
</script>

<template>
  <LazyUModal
    v-if="items.length > 0"
    v-model:open="open"
    class="media-modal"
    :close="false"
    :description="modalAccessibleDescription"
    fullscreen
    :portal="portal"
    :title="modalAccessibleTitle"
    :ui="{
      overlay: 'bg-black/90 backdrop-blur-sm',
      content: 'bg-transparent divide-none p-0',
      body: 'relative h-dvh overflow-hidden p-0',
      header: 'hidden',
    }"
  >
    <template v-if="open" #body>
      <UButton
        aria-label="Close media preview"
        class="absolute top-4 right-4 z-20 shadow-lg sm:top-6 sm:right-6"
        color="neutral"
        icon="i-lucide-x"
        size="lg"
        variant="soft"
        @click="closeModal"
      />

      <div
        v-if="items.length === 1 && firstItem"
        class="flex h-full w-full items-center justify-center p-4"
      >
        <div
          :class="['overflow-hidden', theme.media.rounded]"
          :style="mediaFrameStyle(firstItem)"
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
        :arrows="items.length > 1"
        :items="items"
        loop
        :next="nextCarouselButton"
        :next-icon="theme.carousel.arrows?.nextIcon"
        :prev="prevCarouselButton"
        :prev-icon="theme.carousel.arrows?.prevIcon"
        :start-index="startIndex"
        :ui="{
          root: 'stir-media-modal-carousel h-full',
          viewport: 'h-full',
          container: 'ms-0 h-full items-center',
          item: 'flex h-full basis-full items-center justify-center overflow-hidden px-4',
          prev: 'hidden opacity-100 md:inline-flex',
          next: 'hidden opacity-100 md:inline-flex',
        }"
        @select="handleCarouselSelect"
      >
        <template #default="{ item }">
          <div
            :class="['mx-auto overflow-hidden', theme.media.rounded]"
            :style="mediaFrameStyle(item)"
          >
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
          class="absolute bottom-4 left-1/2 z-10 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 space-y-1 rounded-lg bg-black/80 px-4 py-3 text-center text-white shadow-xl backdrop-blur-md sm:bottom-6 sm:w-auto sm:min-w-64"
        >
          <div
            v-if="theme.mediaModal.title && modalTitle"
            class="text-sm leading-snug font-semibold sm:text-base"
          >
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
  .media-modal img {
    @apply max-h-[80vh] object-contain;
  }
}
</style>
