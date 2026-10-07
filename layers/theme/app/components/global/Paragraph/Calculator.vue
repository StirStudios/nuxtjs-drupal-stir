<script setup lang="ts">
import { normalizeScriptOrigin } from '#stir/composables/useThirdPartyScript'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  venueId?: string
  direction?: string
  /**
   * @deprecated Ignored. The loader address is site configuration
   * (runtimeConfig.public.calculator.loaderUrl), not content; declared only
   * so Drupal sites that still send it do not render it as an attribute.
   */
  embedUrl?: string

  editLink?: string
}>()

const attrs = useAttrs()

const venueId = computed(() =>
  String(props.venueId || attrs.venue_id || '').trim(),
)

// Configuration, never content: editors choose the venue, and each
// environment sets where the widget loads from.
const loaderSrc = String(useRuntimeConfig().public.calculator?.loaderUrl || '').trim()

if (!loaderSrc && import.meta.dev) {
  console.warn('[stir] The calculator has no loader: set runtimeConfig.public.calculator.loaderUrl.')
}

const widgetAttrs = computed(() => {
  const elementAttrs: Record<string, string> = { 'data-piper-widget': '' }

  if (venueId.value) elementAttrs['data-piper-venue'] = venueId.value

  return elementAttrs
})

const getInitPiperWidget = () =>
  (window as Window & { initPiperWidget?: () => void }).initPiperWidget

const { isLoaded } = useThirdPartyScript(loaderSrc, {
  // The address is trusted configuration; HTTPS is still required.
  allowedOrigins: [normalizeScriptOrigin(loaderSrc)].filter(Boolean),
  isReady: () => typeof getInitPiperWidget() === 'function',
})

// On a repeat visit the loader is already loaded during setup, before
// <ClientOnly> renders the widget element, so wait for both. The loader skips
// hosts it has already initialised.
const widgetEl = useTemplateRef<HTMLElement>('widgetEl')

watch(
  [isLoaded, widgetEl],
  ([loaded, el]) => {
    if (loaded && el && venueId.value) getInitPiperWidget()?.()
  },
  { immediate: true },
)
</script>

<template>
  <EditLink :id="id" :link="editLink" :parent-uuid="parentUuid">
    <ClientOnly>
      <div ref="widgetEl" v-bind="widgetAttrs" />
    </ClientOnly>
  </EditLink>
</template>
