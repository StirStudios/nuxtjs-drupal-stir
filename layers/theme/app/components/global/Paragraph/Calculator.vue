<script setup lang="ts">
import { useAttrs } from 'vue'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  embedUrl?: string
  apiOrigin?: string
  piperOrigin?: string
  venueId?: string

  editLink?: string
}>()

const attrs = useAttrs()

const toTrimmedString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const toOrigin = (value: string) => {
  try {
    return value ? new URL(value).origin : ''
  } catch {
    return ''
  }
}

const venueId = computed(() =>
  toTrimmedString(props.venueId || attrs.venue_id),
)

const loaderSrc = computed(() =>
  toTrimmedString(props.embedUrl || attrs.embed_url),
)

const appOrigin = computed(() =>
  toTrimmedString(
    props.apiOrigin ||
      props.piperOrigin ||
      attrs.api_origin ||
      attrs.piper_origin ||
      attrs.apiBase ||
      attrs.api_base ||
      attrs.origin,
  ),
)

const apiBase = computed(() =>
  toOrigin(appOrigin.value) || toOrigin(loaderSrc.value),
)

const widgetAttrs = computed<Record<string, string>>(() => {
  const elementAttrs: Record<string, string> = {
    'data-piper-widget': '',
  }

  if (venueId.value) elementAttrs['data-piper-venue'] = venueId.value
  if (apiBase.value) elementAttrs['data-piper-origin'] = apiBase.value

  return elementAttrs
})

const getInitPiperWidget = () =>
  (window as Window & { initPiperWidget?: () => void }).initPiperWidget

const { isLoaded } = useThirdPartyScript(loaderSrc, {
  kind: 'calculator',
  isReady: () => typeof getInitPiperWidget() === 'function',
})

watch(
  isLoaded,
  (loaded) => {
    if (loaded && venueId.value) getInitPiperWidget()?.()
  },
  { immediate: true },
)
</script>

<template>
  <EditLink :link="editLink" :parent-uuid="parentUuid">
    <ClientOnly>
      <div v-bind="widgetAttrs" />
    </ClientOnly>
  </EditLink>
</template>
