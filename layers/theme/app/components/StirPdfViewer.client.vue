<script setup lang="ts">
declare global {
  interface Window {
    __stirPdfViewerWarned?: boolean
  }
}

// Stub component for projects that do not include PDF Viewer
if (import.meta.dev && !window.__stirPdfViewerWarned) {
  window.__stirPdfViewerWarned = true
  console.warn(
    '[StirPdfViewer] PDF Viewer is not installed. Add vue-pdf-viewer-core and its \'vue-pdf-viewer-core/nuxt\' module to enable document previews.',
  )
}
</script>

<template>
  <UAlert
    color="error"
    description="Install vue-pdf-viewer-core and add its Nuxt module to enable document previews."
    icon="i-lucide-file-warning"
    title="PDF Viewer is not installed"
    variant="soft"
  />
</template>
