<script setup lang="ts">
const props = defineProps<{
  forcedLayout?: string
}>()

const { fetchPage, renderCustomElements, usePageHead, getPage } = useDrupalCe()
const { pageLayout, isAdministrator, isFront } = usePageContext()
const pageState = getPage()
const route = useRoute()
const pageRequest = useResolvedPageRequest(route)
const theme = useAppConfig().stirTheme

const page = await fetchPage(
  pageRequest.path.value,
  { query: route.query },
  customPageError,
)
const layout = computed(() => props.forcedLayout || pageLayout.value)
const routeSlugClass = computed(() => {
  if (Array.isArray(route.params.slug)) return route.params.slug[0] || ''
  return typeof route.params.slug === 'string' ? route.params.slug : ''
})

type DrupalMetaTag = { name?: string; content?: string }
type JsonLdValue = Record<string, unknown> | unknown[] | string | null | undefined

const bodyClasses = computed(() =>
  [
    routeSlugClass.value,
    isFront.value ? 'front' : '',
    isAdministrator.value ? 'logged-in' : '',
    pageState.value?.content?.element || '',
  ]
    .filter(Boolean)
    .join(' '),
)

const seoTitle = computed(() => {
  const meta = page.value?.metatags?.meta

  if (!Array.isArray(meta)) return ''

  const titleTag = meta.find((tag: DrupalMetaTag) => tag.name === 'title')

  return typeof titleTag?.content === 'string' ? titleTag.content : ''
})

const jsonLd = computed(() => cleanJsonLd(page.value?.metatags?.jsonld as JsonLdValue))

usePageHead(page, ['meta', 'link'])

useHead(() => ({
  title: seoTitle.value || page.value?.title || '',
  bodyAttrs: {
    class: bodyClasses.value,
  },
  script: jsonLd.value === null
    ? []
    : [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd.value),
        },
      ],
}))

function cleanJsonLd(value: JsonLdValue): JsonLdValue | null {
  if (Array.isArray(value)) {
    const items = value.filter(item => hasJsonLdValue(item))

    return items.length > 0 ? items : null
  }

  return hasJsonLdValue(value) ? value : null
}

function hasJsonLdValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.some(item => hasJsonLdValue(item))
  if (typeof value === 'object') return Object.keys(value).length > 0

  return false
}

function customPageError(error: unknown) {
  const payload = getErrorPayload(error)
  const code = payload?.statusCode ?? 500
  const message = payload?.statusMessage ?? 'Page not found'

  throw createError({ statusCode: code, statusMessage: message })
}

function getErrorPayload(
  error: unknown,
): { statusCode?: number; statusMessage?: string } | null {
  if (!error || typeof error !== 'object') return null
  const value = (error as { value?: unknown }).value

  if (!value || typeof value !== 'object') return null
  const payload = value as {
    statusCode?: number
    statusMessage?: string
  }

  return payload
}
</script>

<template>
  <NuxtLayout :name="layout">
    <slot
      :layout="layout"
      :page="page"
      :render-custom-elements="renderCustomElements"
      :theme="theme"
    >
      <LazySiteBreadcrumbs v-if="theme.showBreadcrumbs" />
      <component :is="renderCustomElements(page.content)" v-if="page?.content" />
      <LazyRegionArea area="after_main" hydrate-on-visible />
    </slot>
  </NuxtLayout>
</template>
