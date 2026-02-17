<script setup lang="ts">
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  align?: string
  spacing?: string
  width?: string

  color?: string
  size?: string
  variant?: string
  icon?: string
  block?: boolean

  link?: {
    element?: string
    title?: string
    url?: string
    external?: boolean
  }

  editLink?: string
}>()

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const open = ref(false)
const theme = useAppConfig().stirTheme
const linkData = computed(() => props.link || {})
const isExternal = computed(() => !!linkData.value.external)
const btnLabel = computed(() => linkData.value.title || 'View link')
const btnColor = computed(() => props.color || 'primary')
const btnVariant = computed(() => props.variant || 'solid')
const btnSize = computed(() => props.size || 'xl')
const btnBlock = computed(() => props.block ?? false)
const iconName = computed(() => props.icon || null)
const slotMedia = computed(() => tk.mediaItems())
const pdf = computed(() => {
  return (
    slotMedia.value.find(
      (node) => tk.propsOf(node)?.type === 'document' && tk.propsOf(node)?.url,
    ) || null
  )
})

const hasPdf = computed(() => !!pdf.value)
const hasLink = computed(() => !hasPdf.value && !!linkData.value.url)
const pdfProps = computed(() => tk.propsOf(pdf.value ?? undefined))
const pdfTitle = computed(() => String(pdfProps.value?.title || btnLabel.value))
const pdfDescription = computed(() =>
  String(pdfProps.value?.alt || 'PDF document preview'),
)
const pdfUrl = computed(() => pdfProps.value?.url as string | undefined)
</script>

<template>
  <EditLink :link="editLink">
    <div :class="['flex w-full', align, spacing, width]">
      <UButton
        v-if="hasPdf"
        :block="btnBlock"
        class="mt-4"
        :color="btnColor"
        :icon="iconName ?? 'i-lucide-file-text'"
        :label="pdfTitle"
        :size="btnSize"
        :variant="btnVariant"
        @click="open = true"
      />

      <UButton
        v-else-if="hasLink"
        :block="btnBlock"
        class="mt-4"
        :color="btnColor"
        :icon="iconName"
        :label="btnLabel"
        :rel="isExternal ? 'noopener noreferrer' : undefined"
        :size="btnSize"
        :target="isExternal ? '_blank' : undefined"
        :to="linkData.url"
        :variant="btnVariant"
      />
    </div>
  </EditLink>

  <UModal
    v-if="hasPdf && theme.pdf"
    v-model:open="open"
    :description="pdfDescription"
    fullscreen
    :title="pdfTitle"
    :ui="{ body: 'flex-1 m-4 sm:mt-6' }"
  >
    <template #body>
      <PdfViewer :src="pdfUrl" />
    </template>
  </UModal>
</template>
