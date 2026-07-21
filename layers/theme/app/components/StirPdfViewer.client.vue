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
    '[StirPdfViewer] PDF Viewer is not installed. Add a real StirPdfViewer.client.vue in your root app if needed.',
  )
}
</script>

<template>
  <UAlert
    color="error"
    description="Add a project PDF viewer component to enable document previews."
    icon="i-lucide-file-warning"
    title="PDF Viewer is not installed"
    variant="soft"
  />
</template>
