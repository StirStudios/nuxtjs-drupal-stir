<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import type { PopupNode } from '~/composables/usePopupData'
import { usePopupData } from '~/composables/usePopupData'

const { renderCustomElements } = useDrupalCe()
const { popup, config } = usePopupData()
const { y } = useWindowScroll()
const open = ref(false)
const seen = useCookie<boolean | undefined>('marketing_popup', {
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax',
})
const hasTriggered = ref(false)

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

let delayTimer: ReturnType<typeof setTimeout> | null = null
let stopScrollWatch: (() => void) | null = null
let onExitIntent: ((event: MouseEvent) => void) | null = null

function cleanupTriggerHandlers() {
  if (delayTimer) {
    clearTimeout(delayTimer)
    delayTimer = null
  }

  if (stopScrollWatch) {
    stopScrollWatch()
    stopScrollWatch = null
  }

  if (onExitIntent && import.meta.client) {
    document.removeEventListener('mouseout', onExitIntent)
    onExitIntent = null
  }
}

function getPopupProps(node: PopupNode | null): PopupProps {
  if (!node?.props || typeof node.props !== 'object') return {}
  return node.props as PopupProps
}

watch(
  () => popup.value?.props?.uuid,
  () => {
    cleanupTriggerHandlers()
    hasTriggered.value = false
    selectedMedia.value = null
  },
)

const hasPopup = computed(() => !!popup.value)
const title = computed(
  () => getPopupProps(popup.value).webform?.webformTitle ?? 'Announcement',
)

const description = computed(() => getPopupProps(popup.value).text ?? '')
const popupRenderProps = computed(() => {
  const { id, uuid, parentUuid, region, text, webform, editLink, direction } =
    getPopupProps(popup.value)

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

function showModalOnce() {
  if (open.value || (config.value.showOnce && seen.value === true)) return

  open.value = true

  if (config.value.showOnce) {
    seen.value = true
  }
}

function handleTrigger() {
  if (!import.meta.client) return
  if (!popup.value) return
  if (hasTriggered.value) return

  hasTriggered.value = true

  if (config.value.trigger === 'delay') {
    delayTimer = setTimeout(showModalOnce, config.value.delay)
  }

  if (config.value.trigger === 'scroll') {
    stopScrollWatch = watch(
      y,
      (val) => {
        const scrollRoot = document.documentElement
        const scrollable = scrollRoot.scrollHeight - window.innerHeight
        if (scrollable <= 0) return

        const percent = val / scrollable

        if (percent > config.value.scrollThreshold) {
          showModalOnce()
          cleanupTriggerHandlers()
        }
      },
      { immediate: true },
    )
  }

  if (config.value.trigger === 'exit') {
    onExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) {
        showModalOnce()
        cleanupTriggerHandlers()
      }
    }

    document.addEventListener('mouseout', onExitIntent)
  }
}

watch(
  popup,
  (val) => {
    cleanupTriggerHandlers()
    if (val) {
      handleTrigger()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  cleanupTriggerHandlers()
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
        <UButton
          aria-label="Close"
          class="absolute end-5 top-5 z-100"
          color="neutral"
          icon="i-lucide-x"
          variant="solid"
          @click="open = false"
        />

        <ParagraphPopup
          v-bind="popupRenderProps"
          :on-close="closeModal"
        >
          <template #media>
            <component
              :is="renderCustomElements(selectedMedia)"
              v-if="selectedMedia"
            />
          </template>
        </ParagraphPopup>
      </template>
    </UModal>
  </ClientOnly>
</template>
