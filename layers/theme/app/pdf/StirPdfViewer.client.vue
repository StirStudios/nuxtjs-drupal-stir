<script setup lang="ts">
// Replaces the StirPdfViewer stub when the project installs the
// vue-pdf-viewer-core Nuxt module, which registers PdfViewer.
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  src?: string
}>()

const attrs = useAttrs()
</script>

<template>
  <PdfViewer v-if="props.src" v-bind="attrs" :src="props.src" />
</template>
