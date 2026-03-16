<script setup lang="ts">
const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  embedUrl?: string
}>()

const normalizedEmbedUrl = computed(() => {
  const raw = props.embedUrl?.trim()

  if (!raw) return ''
  return raw.startsWith('http') ? raw : `https://${raw}`
})

onMounted(() => {
  const scriptId = '__enzuzo-root-script'
  const rootId = '__enzuzo-root'

  if (!normalizedEmbedUrl.value || document.getElementById(scriptId)) return

  const target = document.getElementById(rootId)

  if (!target) return

  const script = document.createElement('script')

  script.id = scriptId
  script.src = normalizedEmbedUrl.value
  script.defer = true
  script.crossOrigin = 'anonymous'
  script.referrerPolicy = 'no-referrer'

  target.insertAdjacentElement('afterend', script)
})
</script>

<template>
  <div id="__enzuzo-root" />
</template>
