import type { GlobalSeoResponse } from '../../shared/types/globalSeo'
import { prepareGlobalSeoAssets } from '../utils/globalSeoAssets'

type CmsGlobalSeoConfig = {
  enabled?: boolean
  ignoredPathPrefixes?: string[]
  ignoredPaths?: string[]
  drupalRouteNames?: string[]
  lang?: string
  iconLinks?: Array<Record<string, string>>
  socialImage?: {
    enabled?: boolean
    format?: string
    height?: number
    quality?: number
    version?: string
    width?: number
  }
}

type UseHeadFactory = Extract<
  Parameters<typeof useHead>[0],
  (...args: never[]) => unknown
>
type ConsumerReactiveHead = Exclude<ReturnType<UseHeadFactory>, false | null | undefined>

function resolveCmsGlobalSeoConfig(config: CmsGlobalSeoConfig = {}): Required<CmsGlobalSeoConfig> {
  return {
    enabled: config.enabled === true,
    ignoredPathPrefixes: Array.isArray(config.ignoredPathPrefixes)
      ? config.ignoredPathPrefixes
      : [],
    ignoredPaths: Array.isArray(config.ignoredPaths) ? config.ignoredPaths : [],
    drupalRouteNames: Array.isArray(config.drupalRouteNames)
      ? config.drupalRouteNames
      : ['slug'],
    lang: typeof config.lang === 'string' && config.lang.trim() !== ''
      ? config.lang.trim()
      : 'en',
    iconLinks: Array.isArray(config.iconLinks) ? config.iconLinks : [],
    socialImage: config.socialImage || {},
  }
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith('/')) {
    return path.replace(/\/+$/, '')
  }

  return path || '/'
}

function isIgnoredPath(path: string, config: Required<CmsGlobalSeoConfig>) {
  const normalizedPath = normalizePath(path)

  if (config.ignoredPaths.some(ignored => normalizePath(ignored) === normalizedPath)) {
    return true
  }

  return config.ignoredPathPrefixes.some((prefix) => {
    const normalizedPrefix = normalizePath(prefix)

    return (
      normalizedPrefix !== '/' &&
      (normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`))
    )
  })
}

function isDrupalRoute(route: ReturnType<typeof useRoute>, config: Required<CmsGlobalSeoConfig>) {
  return config.drupalRouteNames.includes(String(route.name || ''))
}

function withMetaKeys(tags: Array<Record<string, string>> = []): Array<Record<string, string>> {
  return tags.flatMap((tag) => {
    if (!tag.name && !tag.property && !tag.charset && !tag['http-equiv']) return []

    const key = tag.name || tag.property || undefined

    return [key ? { ...tag, key } : tag]
  })
}

function withLinkKeys(tags: Array<Record<string, string>> = []): Array<Record<string, string>> {
  return tags.flatMap((tag) => {
    if (!tag.rel || !tag.href) return []

    const key = [tag.rel, tag.sizes, tag.href].filter(Boolean).join(':') || undefined

    return [key ? { ...tag, key } : tag]
  })
}

export default defineNuxtPlugin(async () => {
  const route = useRoute()
  const appConfig = useAppConfig()
  const config = resolveCmsGlobalSeoConfig((appConfig.cmsGlobalSeo || {}) as CmsGlobalSeoConfig)
  const defaults = useState<GlobalSeoResponse | null>('cms-global-seo', () => null)
  const lang = computed(() => defaults.value?.lang || config.lang)
  const image = useImage()
  const publicOrigin = useRequestURL().origin

  // Register head synchronously before any await so Nuxt keeps plugin context.
  useHead(
    (): ConsumerReactiveHead => {
      const head = {
        htmlAttrs: { lang: lang.value },
      }

      if (
        !config.enabled ||
        defaults.value === null ||
        isIgnoredPath(route.path, config) ||
        isDrupalRoute(route, config)
      ) {
        return head as ConsumerReactiveHead
      }

      const prepared = prepareGlobalSeoAssets(
        defaults.value,
        config,
        (source, modifiers) => image(source, modifiers),
        publicOrigin,
      )

      return {
        ...head,
        link: withLinkKeys(prepared.link),
        meta: withMetaKeys(prepared.meta),
      } as unknown as ConsumerReactiveHead
    },
    {
      tagPriority: 'low',
    },
  )

  if (config.enabled && defaults.value === null) {
    defaults.value = await $fetch<GlobalSeoResponse>('/api/seo/global').catch(() => ({
      meta: [],
      link: [],
    }))
  }
})
