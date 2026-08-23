<script setup lang="ts">
import {
  buildLayoutEditLinkIndex,
  buildPresentationEditTargetIndex,
  layoutEditLinksKey,
  presentationEditTargetsKey,
  withoutPresentationEditMetadata,
} from '../../utils/layoutEditLinks'
import { pageRefreshKey } from '../../utils/pageRefresh'
import type {
  CmsGlobalSeoAssetConfig,
  SeoImageResolver,
} from '../../../../seo/app/utils/globalSeoAssets'
import type { GlobalSeoResponse } from '../../../../seo/shared/types/globalSeo'
import { prepareGlobalSeoAssets } from '../../../../seo/app/utils/globalSeoAssets'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import { getDrupalOrigin } from '../../utils/drupalUrl'

const props = defineProps<{
  forcedLayout?: string
}>()

const { fetchPage, refreshPage, renderCustomElements, usePageHead, getPage } = useStirDrupalCe()
const { pageLayout, isAuthenticated, isFront } = usePageContext()
const pageState = getPage()

provide(
  layoutEditLinksKey,
  computed(() => buildLayoutEditLinkIndex(pageState.value)),
)
provide(
  presentationEditTargetsKey,
  computed(() => buildPresentationEditTargetIndex(pageState.value)),
)

const route = useRoute()
const nuxtApp = useNuxtApp() as { $localePath?: (path: string) => string }
const pageRequest = useResolvedPageRequest(route)
const theme = useAppConfig().stirTheme
const seoConfig = (useAppConfig().cmsGlobalSeo || {}) as CmsGlobalSeoAssetConfig
const image = useImage() as unknown as SeoImageResolver
const runtimeConfig = useRuntimeConfig()
const drupalOrigin = getDrupalOrigin(runtimeConfig.public)
const requestOrigin = useRequestURL().origin
const publicOrigin = (() => {
  if (import.meta.server && typeof runtimeConfig.siteUrl === 'string') {
    try {
      return new URL(runtimeConfig.siteUrl).origin
    }
    catch {
      // Fall back to the request origin for invalid or absent configuration.
    }
  }

  return requestOrigin
})()

const page = await fetchPage(
  pageRequest.path.value,
  { query: route.query },
  customPageError,
)
const pageRenderRevision = ref(0)
const renderablePageContent = computed(() =>
  withoutPresentationEditMetadata(page.value?.content),
)

provide(
  pageRefreshKey,
  async () => {
    await refreshPage(page, pageRequest.path.value, { query: route.query })
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
const layout = computed(() => (props.forcedLayout || pageLayout.value || 'default') as 'default')
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

  const prepared = prepareGlobalSeoAssets(
    metatags as GlobalSeoResponse,
    seoConfig,
    image,
    publicOrigin,
    drupalOrigin,
  )

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
        <LazySiteBreadcrumbs v-if="theme.showBreadcrumbs" />
        <component
          :is="renderCustomElements(renderablePageContent)"
          v-if="renderablePageContent"
          :key="pageRenderRevision"
        />
        <LazyRegionArea area="after_main" />
        <LazyRegionArea
          v-if="theme.footer?.showSubFooterRegion !== false"
          area="sub_footer"
          as="aside"
        />
      </PageRevealScope>
    </slot>
  </NuxtLayout>
</template>
