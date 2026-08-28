<script setup lang="ts">
import type { PopupMedia, PopupNode, PopupProps } from '#stir/types'

const appConfig = useAppConfig()
const { renderCustomElements } = useStirDrupalCe()
const { popup, config } = usePopupData()
const LazyParagraphPopup = defineAsyncComponent(
  () => import('../global/Paragraph/Popup.vue'),
)

function getPopupProps(node: PopupNode | null): PopupProps {
  if (!node?.props || typeof node.props !== 'object') return {}
  return node.props as PopupProps
}

const hasPopup = computed(() => !!popup.value)
const popupProps = computed(() => getPopupProps(popup.value))

const { open, shouldRenderPopupContent } = usePopupBehavior({
  popup,
  config,
})
const title = computed(() => popupProps.value.webform?.webformTitle ?? 'Announcement')
const description = computed(() => popupProps.value.text ?? '')
const popupComponent = computed(() => {
  const componentName = typeof appConfig.popup?.component === 'string'
    ? appConfig.popup.component.trim()
    : ''

  if (!componentName) {
    return LazyParagraphPopup
  }

  const resolvedComponent = resolveComponent(componentName)

  return typeof resolvedComponent === 'string'
    ? LazyParagraphPopup
    : resolvedComponent
})
const popupRenderProps = computed(() => {
  const {
    id,
    uuid,
    parentUuid,
    region,
    text,
    alert,
    webform,
    editLink,
    direction,
  } = popupProps.value

  if (id === undefined || uuid === undefined) {
    return null
  }

  return {
    id,
    uuid,
    parentUuid,
    region,
    text,
    alert,
    webform,
    editLink,
    direction,
  }
})

const selectedMedia = ref<PopupMedia | null>(null)
const portal = useOverlayPortal()

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
      :close="false"
      :description="description"
      :portal="portal"
      :title="title"
      :ui="{
        overlay: 'fixed inset-0 bg-black/60',
        content: 'popup divide-none ring-0',
        header: 'sr-only',
        body: 'p-0 sm:p-0',
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
            @click="closeModal"
          />

          <component
            :is="popupComponent"
            v-if="popupRenderProps"
            v-bind="popupRenderProps"
            :on-close="closeModal"
          >
            <template #media>
              <component
                :is="renderCustomElements(selectedMedia)"
                v-if="selectedMedia"
              />
            </template>
          </component>
        </template>
      </template>
    </UModal>
  </ClientOnly>
</template>
