<script setup lang="ts">
// Replaces the StirPdfViewer stub when the project installs the
// vue-pdf-viewer-core Nuxt module (0.4.0 or later), which registers PdfViewer.
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  src?: string
  title?: string
}>()

const attrs = useAttrs()
</script>

<template>
  <!-- The toolbar sticks below the pinned header and editorial tabs; sites
       with more fixed chrome override --stir-pdf-toolbar-offset. -->
  <PdfViewer
    v-if="props.src"
    v-bind="attrs"
    class="[--lpv-toolbar-offset:var(--stir-pdf-toolbar-offset,calc(var(--ui-header-height)+var(--stir-editorial-offset,0px)))]"
    :src="props.src"
    :title="props.title"
  />
</template>
