<script setup lang="ts">
import { resolveAllowedScriptUrl } from '../../../composables/useThirdPartyScript'

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

const appConfig = useAppConfig()
const safeEmbedUrl = computed(() => resolveAllowedScriptUrl(
  normalizedEmbedUrl.value,
  appConfig.thirdPartyScripts?.allowedOrigins?.enzuzo || [],
))

let script: HTMLScriptElement | null = null

onMounted(() => {
  const policyRoot = document.getElementById('__enzuzo-root')

  if (!policyRoot || !safeEmbedUrl.value || script) return

  script = document.createElement('script')
  script.id = '__enzuzo-root-script'
  script.src = safeEmbedUrl.value
  script.defer = true
  script.crossOrigin = 'anonymous'
  script.referrerPolicy = 'no-referrer'

  policyRoot.insertAdjacentElement('afterend', script)
})

onBeforeUnmount(() => {
  script?.remove()
})
</script>

<template>
  <div id="__enzuzo-root" />
</template>
