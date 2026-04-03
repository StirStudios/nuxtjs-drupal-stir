<script setup lang="ts">
const props = defineProps<{
  forcedLayout?: string
}>()

const { renderCustomElements, usePageHead, getPage } = useDrupalCe()
const { pageLayout, isAdministrator, isFront } = usePageContext()
const pageState = getPage()
const route = useRoute()
const pageRequest = useResolvedPageRequest(route)
const theme = useAppConfig().stirTheme

const { page, renderablePageContent } = await useDrupalPageRoute(pageRequest.path.value)
const layout = computed(() => props.forcedLayout || pageLayout.value)
const routeSlugClass = computed(() => {
  if (Array.isArray(route.params.slug)) return route.params.slug[0] || ''
  return typeof route.params.slug === 'string' ? route.params.slug : ''
})
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

usePageHead(page)

useHead({
  bodyAttrs: {
    class: bodyClasses,
  },
})
</script>

<template>
  <NuxtLayout :name="layout">
    <slot
      :layout="layout"
      :page="page"
      :render-custom-elements="renderCustomElements"
      :theme="theme"
    >
      <LazySiteBreadcrumbs v-if="theme.crumbs" />
      <component
        :is="renderCustomElements(renderablePageContent)"
        v-if="renderablePageContent"
      />
      <LazyRegionArea area="after_main" />
    </slot>
  </NuxtLayout>
</template>
