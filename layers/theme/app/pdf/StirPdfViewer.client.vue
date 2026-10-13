<script setup lang="ts">
// Replaces the StirPdfViewer stub when the project installs the
// vue-pdf-viewer-core Nuxt module, which registers PdfViewer.
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  src?: string
  title?: string
}>()

const attrs = useAttrs()

const viewer = ref<{ $el?: Element } | null>(null)

// The library hardcodes its region and toolbar names, so pages with several
// viewers expose duplicate landmarks unless the document title is added.
const libraryLabels = ['PDF document viewer', 'PDF pages', 'PDF viewer toolbar']

watchEffect(() => {
  const title = props.title?.trim()
  const root = viewer.value?.$el

  if (!title || !(root instanceof Element)) return

  for (const label of libraryLabels) {
    const selector = `[aria-label="${label}"]`
    const element = root.matches(selector) ? root : root.querySelector(selector)

    element?.setAttribute('aria-label', `${title}, ${label}`)
  }
}, { flush: 'post' })
</script>

<template>
  <PdfViewer v-if="props.src" ref="viewer" v-bind="attrs" :src="props.src" />
</template>

<style scoped>
/* The library's sticky toolbar uses z-index 60, which paints over the site
   header (z-50). Isolate each viewer and offset the toolbar below the pinned
   chrome; sites with extra fixed bars override --stir-pdf-toolbar-offset. */
.lpv-root {
  isolation: isolate;
}

.lpv-root :deep(.lpv-toolbar) {
  z-index: 1;
  top: calc(
    var(--stir-pdf-toolbar-offset, calc(var(--ui-header-height) + var(--stir-editorial-offset, 0px)))
    + var(--lpv-toolbar-sticky-top)
  );
}
</style>
