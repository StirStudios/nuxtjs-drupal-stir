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
    '[PdfViewer] PDF Viewer is not installed. Add a real PdfViewer.vue in your root app if needed.',
  )
}
</script>

<template>
  <div
    class="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-600 italic"
  >
    PDF Viewer is not installed. This is a placeholder component.
  </div>
</template>
