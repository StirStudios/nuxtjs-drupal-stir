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

// The library hardcodes the toolbar name, so pages with several viewers
// expose identical toolbars unless the document title is added.
watchEffect(() => {
  const label = props.title?.trim()
  const toolbar = viewer.value?.$el?.querySelector('.lpv-toolbar')

  if (label && toolbar) toolbar.setAttribute('aria-label', `${label} toolbar`)
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
