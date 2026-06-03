<script setup lang="ts">
import { defineAsyncComponent, resolveComponent } from 'vue'
import type { WebformDefinition } from '~/types'

const appConfig = useAppConfig()
const { renderCustomElements } = useDrupalCe()
const { popup, config } = usePopupData()
const LazyParagraphPopup = defineAsyncComponent(
  () => import('~/components/global/Paragraph/Popup.vue'),
)

type PopupNode = {
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

type PopupProps = {
  id?: string | number
  uuid?: string
  parentUuid?: string
  region?: string
  text?: string
  webform?: WebformDefinition
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
const dismissedPopups = useState<Record<string, boolean>>(
  'marketing_popup_dismissed',
  () => ({}),
)
const popupDismissKey = computed(() => {
  const popupUuid = popupProps.value?.uuid

  if (typeof popupUuid === 'string' && popupUuid.trim()) {
    return popupUuid.trim()
  }

  const fallbackId = popupProps.value?.id

  if (typeof fallbackId === 'number' || typeof fallbackId === 'string') {
    return String(fallbackId)
  }

  return null
})
const isPopupDismissed = computed(() => {
  if (!popupDismissKey.value) return false

  return Boolean(dismissedPopups.value[popupDismissKey.value])
})

const { open, shouldRenderPopupContent } = usePopupBehavior({
  popup,
  config,
  suppress: computed(() => isPopupDismissed.value),
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
  const { id, uuid, parentUuid, region, text, webform, editLink, direction } =
    popupProps.value

  if (id === undefined || uuid === undefined) {
    return null
  }

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
const portal = useOverlayPortal()

const closeModal = () => {
  open.value = false
}

function markPopupDismissed() {
  if (!popupDismissKey.value) return
  dismissedPopups.value[popupDismissKey.value] = true
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

watch(
  open,
  (value, oldValue) => {
    if (oldValue && !value) {
      markPopupDismissed()
    }
  },
)
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
            @click="open = false"
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
