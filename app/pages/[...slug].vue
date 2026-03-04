<script lang="ts" setup>
const { fetchPage, renderCustomElements, usePageHead, getPage } = useDrupalCe()
const pageState = getPage()
const { pageLayout, isAdministrator } = usePageContext()
const route = useRoute()
const theme = useAppConfig().stirTheme

const page = await fetchPage(
  route.path,
  { query: route.query },
  customPageError,
)

const bodyClasses = computed(() =>
  [
    Array.isArray(route.params.slug)
      ? route.params.slug[0]
      : route.params.slug || 'front',
    isAdministrator.value ? 'logged-in' : '',
    pageState.value?.content?.element || '',
  ]
    .filter(Boolean)
    .join(' '),
)

usePageHead(page)

useHead({
  bodyAttrs: {
    class: bodyClasses,
  },
})

definePageMeta({
  key: (route) => route.fullPath.split('#')[0] ?? route.path,
})

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
  <NuxtLayout :name="pageLayout">
    <LazySiteBreadcrumbs v-if="theme.crumbs" />
    <component :is="renderCustomElements(page.content)" v-if="page?.content" />
    <LazyRegionArea area="after_main" />
  </NuxtLayout>
</template>
