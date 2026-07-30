<script setup lang="ts">
const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  embedUrl?: string
  direction?: string
  editLink?: string
}>()

const normalizedEmbedUrl = computed(() => {
  const raw = props.embedUrl?.trim()

  if (!raw) return ''
  return raw.startsWith('http') ? raw : `https://${raw}`
})

useThirdPartyScript(normalizedEmbedUrl, {
  attrs: {
    crossorigin: 'anonymous',
    referrerpolicy: 'no-referrer',
  },
  id: '__enzuzo-root-script',
  kind: 'enzuzo',
  requiresConsent: false,
})
</script>

<template>
  <ParagraphReveal :id="id" :direction="direction">
    <div id="__enzuzo-root" />
  </ParagraphReveal>
</template>
