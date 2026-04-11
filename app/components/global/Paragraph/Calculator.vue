<script setup lang="ts">
import { useAttrs } from 'vue'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  embedUrl?: string
  venueId?: string

  editLink?: string
}>()

const attrs = useAttrs()

const toTrimmedString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const venueId = computed(() =>
  toTrimmedString(props.venueId || attrs.venue_id),
)

const loaderSrc = computed(() =>
  toTrimmedString(props.embedUrl || attrs.embed_url),
)

const apiBase = computed(() => {
  try {
    return loaderSrc.value ? new URL(loaderSrc.value).origin : ''
  } catch {
    return ''
  }
})

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

const ensureLoaderScript = async (src: string) => {
  if (typeof getInitPiperWidget() === 'function') return

  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-piper-loader-src="${src}"]`,
  )

  if (existing) {
    await new Promise<void>((resolve, reject) => {
      if (typeof getInitPiperWidget() === 'function') {
        resolve()
        return
      }

      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('piper_loader_failed')),
        { once: true },
      )
    })
    return
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')

    script.src = src
    script.defer = true
    script.dataset.piperLoaderSrc = src
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => reject(new Error('piper_loader_failed')),
      { once: true },
    )
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (!loaderSrc.value || !venueId.value) return

  try {
    await ensureLoaderScript(loaderSrc.value)
    getInitPiperWidget()?.()
  } catch {
    // Do not throw on widget loader failure; this component should fail gracefully.
  }
})
</script>

<template>
  <EditLink :link="editLink" :parent-uuid="parentUuid">
    <ClientOnly>
      <div v-bind="widgetAttrs" />
    </ClientOnly>
  </EditLink>
</template>
