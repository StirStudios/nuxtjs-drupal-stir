<script setup lang="ts">
import { useMediaModal } from '#stir/composables/useMediaModal'
import { useSlotsToolkit } from '#stir/composables/useSlotsToolkit'
import { normalizeDrupalMediaType } from '../../../utils/drupalMediaTypes'
import { resolveDrupalLink, type DrupalLink } from '#stir/utils/drupalLink'
import {
  resolveBooleanProp,
  resolveUiButtonVariant,
  resolveUiColor,
  resolveUiSize,
} from '#stir/utils/nuxtUiProps'
import { resolveAlignClasses, resolveWidthClasses, type AlignConfig } from '#stir/utils/gridClasses'
import { resolveSpacingClasses } from '#stir/utils/spacingClasses'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  align?: AlignConfig
  spacingTop?: string
  spacingBottom?: string
  width?: string
  direction?: string

  color?: string
  size?: string
  variant?: string
  icon?: string
  block?: boolean

  link?: DrupalLink

  editLink?: string
}>()

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const open = ref(false)
const portal = useOverlayPortal()
const theme = useAppConfig().stirTheme
const spacing = computed(() => resolveSpacingClasses(theme?.presentation?.spacing, props.spacingTop, props.spacingBottom))
const linkData = computed(() => resolveDrupalLink(props.link))
const isExternal = computed(() => !!linkData.value.external)
const linkText = computed(() => String(linkData.value.title ?? '').trim())
const btnLabel = computed(() => linkText.value || 'View link')
const btnColor = computed(() => resolveUiColor(props.color))
const btnVariant = computed(() => resolveUiButtonVariant(props.variant))
const btnSize = computed(() => resolveUiSize(props.size, 'xl'))
const btnBlock = computed(() => resolveBooleanProp(props.block))
const alignClasses = computed(() => resolveAlignClasses(props.align))
const widthClasses = computed(() => resolveWidthClasses(props.width, props.align))
const iconName = computed(() => props.icon || null)
const buttonStyle = computed(() => ({
  block: btnBlock.value,
  color: btnColor.value,
  size: btnSize.value,
  variant: btnVariant.value,
}))
const slotMedia = computed(() => tk.mediaItems())

type MediaDocumentProps = {
  type?: unknown
  url?: unknown
  title?: unknown
  alt?: unknown
}

const pdfProps = computed(() => {
  for (const node of slotMedia.value) {
    const media = tk.propsOf(node) as MediaDocumentProps

    if (
      media.type !== 'document' ||
      typeof media.url !== 'string' ||
      !media.url
    ) {
      continue
    }
    return media
  }
  return null
})

const hasPdf = computed(() => !!pdfProps.value)
const videoMedia = computed(() => hasPdf.value
  ? []
  : slotMedia.value
      .filter(node => normalizeDrupalMediaType(tk.propsOf<MediaDocumentProps>(node).type) === 'video')
      .slice(0, 1))
const {
  open: videoOpen,
  activeIndex: videoIndex,
  startIndex: videoStartIndex,
  itemsOrdered: videoItems,
  openModal: openVideo,
  onSelect: onSelectVideo,
} = useMediaModal(videoMedia, tk)
const hasVideo = computed(() => videoItems.value.length > 0)
const hasLink = computed(() => !hasPdf.value && !hasVideo.value && !!linkData.value.url)
// As with a document, the editor's link text wins over the media title.
const videoLabel = computed(() =>
  linkText.value || String(videoItems.value[0]?.title || 'Watch video'),
)
// The editor's link text labels the button; the document's own title, which
// editors keep for the media library, only fills in when it is empty.
const pdfTitle = computed(() =>
  linkText.value || String(pdfProps.value?.title || btnLabel.value),
)
const pdfDescription = computed(() =>
  String(pdfProps.value?.alt || 'PDF document preview'),
)
const pdfUrl = computed(() =>
  typeof pdfProps.value?.url === 'string' ? pdfProps.value.url : undefined,
)
</script>

<template>
  <ParagraphReveal
    :id="id"
    as="div"
    :class="['paragraph-button flex w-full', alignClasses, spacing, widthClasses]"
    :direction="direction"
  >
    <EditLink :id="id" :link="editLink" :parent-uuid="parentUuid">
      <UButton
        v-if="hasPdf"
        v-bind="buttonStyle"
        :icon="iconName ?? 'i-lucide-file-text'"
        :label="pdfTitle"
        :target="theme.showPdf ? undefined : '_blank'"
        :to="theme.showPdf ? undefined : pdfUrl"
        @click="() => { open = !!theme.showPdf }"
      />

      <UButton
        v-else-if="hasVideo"
        aria-haspopup="dialog"
        :aria-label="`${videoLabel}, opens video`"
        v-bind="buttonStyle"
        :icon="iconName ?? 'i-lucide-play'"
        :label="videoLabel"
        @click="openVideo(0)"
      />

      <UButton
        v-else-if="hasLink"
        v-bind="buttonStyle"
        :icon="iconName"
        :label="btnLabel"
        :rel="isExternal ? 'noopener noreferrer' : undefined"
        :target="isExternal ? '_blank' : undefined"
        :to="linkData.url"
      />
    </EditLink>
  </ParagraphReveal>

  <ParagraphMediaModal
    v-if="hasVideo"
    v-model:open="videoOpen"
    :active-index="videoIndex"
    :items="videoItems"
    :start-index="videoStartIndex"
    @select="onSelectVideo"
  />

  <LazyUModal
    v-if="hasPdf && theme.showPdf"
    v-model:open="open"
    :description="pdfDescription"
    fullscreen
    :portal="portal"
    :title="pdfTitle"
    :ui="{
      body: 'flex-1 !pt-0 mt-4 sm:mt-6',
    }"
  >
    <template #body>
      <LazyStirPdfViewer class="[--stir-pdf-toolbar-offset:0px]" :src="pdfUrl" :title="pdfTitle" />
    </template>
  </LazyUModal>
</template>
