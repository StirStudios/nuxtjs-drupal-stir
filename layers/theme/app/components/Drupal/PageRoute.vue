<script setup lang="ts">
import {
  buildLayoutEditLinkIndex,
  buildPresentationEditTargetIndex,
  layoutEditLinksKey,
  presentationEditTargetsKey,
} from '../../utils/layoutEditLinks'
import { drupalPageKey } from '../../utils/drupalPage'
import { pageRefreshKey } from '../../utils/pageRefresh'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import { withoutLegacyDrupalViewPage } from '../../utils/pageRequest'

const props = defineProps<{
  forcedLayout?: string
}>()

const { fetchPage, renderCustomElements, usePageHead } = useStirDrupalCe()

const route = useRoute()
const nuxtApp = useNuxtApp() as { $localePath?: (path: string) => string }
const pageRequest = useResolvedPageRequest(route)
const drupalPageQuery = computed(() => withoutLegacyDrupalViewPage(route.query))

if ('page' in route.query) {
  await navigateTo(
    {
      path: route.path,
      query: drupalPageQuery.value,
    },
    { redirectCode: 301, replace: true },
  )
}
const theme = useAppConfig().stirTheme

const page = await fetchPage(
  pageRequest.path.value,
  { query: drupalPageQuery.value },
  customPageError,
)

// fetchPage() is a keyed useFetch; this route component is keyed per page, so
// the key is stable for its lifetime.
const pageDataKey = page.value?.key

provide(drupalPageKey, page)
const { pageLayout, isAuthenticated, isFront } = usePageContext(page)

provide(
  layoutEditLinksKey,
  computed(() => buildLayoutEditLinkIndex(page.value)),
)
provide(
  presentationEditTargetsKey,
  computed(() => buildPresentationEditTargetIndex(page.value)),
)

const pageRenderRevision = ref(0)
const renderablePageContent = computed(() =>
  page.value?.content,
)

provide(
  pageRefreshKey,
  async () => {
    if (pageDataKey) await refreshNuxtData(pageDataKey)
    pageRenderRevision.value += 1
  },
)

if (page.value?.is_front_page === true && route.path !== '/') {
  await navigateTo(
    {
      path: nuxtApp.$localePath?.('/') || '/',
      query: route.query,
    },
    { redirectCode: 301, replace: true },
  )
}

const pageContentProps = computed(() => {
  return (page.value?.content?.props || {}) as {
    pageAnimation?: string
    pageAnimationStagger?: boolean | number | string
  }
})
const pageAnimation = computed(() => pageContentProps.value.pageAnimation)
const pageAnimationStagger = computed(() =>
  resolveBooleanProp(pageContentProps.value.pageAnimationStagger))
const layout = computed(() =>
  (props.forcedLayout || pageLayout.value || 'default') as 'default' | 'clear' | 'links',
)
const isLinkHubLayout = computed(() => layout.value === 'links')
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
    isAuthenticated.value ? 'logged-in' : '',
    page.value?.content?.element || '',
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
const prepareMetatags = useDrupalMetatagPreparer()
const pageHead = computed(() => {
  const currentPage = page.value || {
    title: '',
    metatags: {
      meta: [],
      link: [],
      jsonld: [],
    },
  }
  const metatags = currentPage.metatags

  if (!metatags) return currentPage

  const prepared = prepareMetatags(metatags as unknown as StirDrupalMetatags)

  return {
    ...currentPage,
    metatags: {
      ...metatags,
      link: prepared.link,
      meta: prepared.meta,
    },
  }
})

usePageHead(pageHead, ['meta', 'link'])

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

  throw createError({
    statusCode: code,
    statusMessage: message,
    fatal: true,
  })
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
      <PageRevealScope
        :effect="pageAnimation"
        :stagger="pageAnimationStagger"
      >
        <LazySiteBreadcrumbs v-if="theme.showBreadcrumbs && !isLinkHubLayout" />
        <component
          :is="renderCustomElements(renderablePageContent)"
          v-if="renderablePageContent"
          :key="pageRenderRevision"
        />
        <LazyRegionArea v-if="!isLinkHubLayout" area="after_main" />
        <LazyRegionArea
          v-if="!isLinkHubLayout && theme.footer?.showSubFooterRegion !== false"
          area="sub_footer"
          as="aside"
        />
      </PageRevealScope>
    </slot>
  </NuxtLayout>
</template>
