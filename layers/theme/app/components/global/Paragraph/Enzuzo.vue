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

const root = useTemplateRef<HTMLElement>('root')

// Enzuzo inserts the policy beside its script, so keep the script in this root.
useThirdPartyScript(normalizedEmbedUrl, {
  attrs: {
    crossorigin: 'anonymous',
    referrerpolicy: 'no-referrer',
  },
  container: root,
  id: '__enzuzo-root-script',
  kind: 'enzuzo',
  requiresConsent: false,
})
</script>

<template>
  <ParagraphReveal :id="id" :direction="direction">
    <div id="__enzuzo-root" ref="root" />
  </ParagraphReveal>
</template>
