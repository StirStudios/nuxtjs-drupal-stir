<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { type PopupNode, usePopupData } from '~/composables/usePopupData'

const { renderCustomElements } = useDrupalCe()
const { popup, config } = usePopupData()
const { open, shouldRenderPopupContent } = usePopupBehavior({ popup, config })
const LazyParagraphPopup = defineAsyncComponent(
  () => import('~/components/global/Paragraph/Popup.vue'),
)

type PopupWebform = {
  webformTitle?: string
}

type PopupProps = {
  id?: string | number
  uuid?: string
  parentUuid?: string
  region?: string
  text?: string
  webform?: PopupWebform
  editLink?: string
  direction?: string
}

type PopupMedia = Record<string, unknown>

function getPopupProps(node: PopupNode | null): PopupProps {
  if (!node?.props || typeof node.props !== 'object') return {}
  return node.props as PopupProps
}

const hasPopup = computed(() => !!popup.value)
const popupProps = computed(() => getPopupProps(popup.value))
const title = computed(() => popupProps.value.webform?.webformTitle ?? 'Announcement')
const description = computed(() => popupProps.value.text ?? '')
const popupRenderProps = computed(() => {
  const { id, uuid, parentUuid, region, text, webform, editLink, direction } =
    popupProps.value

  return {
    id,
    uuid,
    parentUuid,
    region,
    text,
    webform,
    editLink,
    direction,
  }
})

const selectedMedia = ref<PopupMedia | null>(null)

const closeModal = () => {
  open.value = false
}

watch(
  () => popup.value?.props?.uuid,
  () => {
    selectedMedia.value = null
  },
)

watch(open, (isOpen) => {
  if (!isOpen) return

  const media = popup.value?.slots?.media

  if (!Array.isArray(media) || !media.length) {
    selectedMedia.value = null
    return
  }

  selectedMedia.value =
    media.length === 1
      ? media[0]
      : media[Math.floor(Math.random() * media.length)]
})
</script>

<template>
  <ClientOnly>
    <UModal
      v-if="hasPopup"
      v-model:open="open"
      :description="description"
      :title="title"
      :ui="{
        overlay: 'fixed inset-0 bg-black/60',
        content:
          'popup fixed bg-default divide-y divide-none flex flex-col focus:outline-none ring-0',
        header: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-16 sr-only',
        wrapper: '',
        body: 'flex-1 overflow-y-auto p-0 sm:p-0',
        footer: 'flex items-center gap-1.5 p-4 sm:px-6',
        title: 'text-highlighted font-semibold',
        description: 'mt-1 text-muted text-sm',
        close: 'absolute top-4 end-4',
      }"
    >
      <template #body>
        <template v-if="shouldRenderPopupContent">
          <UButton
            aria-label="Close"
            class="absolute end-5 top-5 z-100"
            color="neutral"
            icon="i-lucide-x"
            variant="solid"
            @click="open = false"
          />

          <LazyParagraphPopup
            v-bind="popupRenderProps"
            :on-close="closeModal"
          >
            <template #media>
              <component
                :is="renderCustomElements(selectedMedia)"
                v-if="selectedMedia"
              />
            </template>
          </LazyParagraphPopup>
        </template>
      </template>
    </UModal>
  </ClientOnly>
</template>
