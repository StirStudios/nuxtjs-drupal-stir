type CmsGlobalSeo = {
  lang?: string
  meta?: Array<Record<string, string>>
  link?: Array<Record<string, string>>
}

type CmsGlobalSeoConfig = {
  enabled?: boolean
  ignoredPathPrefixes?: string[]
  ignoredPaths?: string[]
  drupalRouteNames?: string[]
}

function resolveCmsGlobalSeoConfig(config: CmsGlobalSeoConfig = {}): Required<CmsGlobalSeoConfig> {
  return {
    enabled: config.enabled !== false,
    ignoredPathPrefixes: Array.isArray(config.ignoredPathPrefixes)
      ? config.ignoredPathPrefixes
      : [],
    ignoredPaths: Array.isArray(config.ignoredPaths) ? config.ignoredPaths : [],
    drupalRouteNames: Array.isArray(config.drupalRouteNames)
      ? config.drupalRouteNames
      : ['slug'],
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

function withMetaKeys(tags: Array<Record<string, string>> = []) {
  return tags.map((tag) => {
    const key = tag.name || tag.property || undefined

    return key ? { ...tag, key } : tag
  })
}

function withLinkKeys(tags: Array<Record<string, string>> = []) {
  return tags.map((tag) => {
    const key = [tag.rel, tag.sizes, tag.href].filter(Boolean).join(':') || undefined

    return key ? { ...tag, key } : tag
  })
}

export default defineNuxtPlugin(async () => {
  const route = useRoute()
  const appConfig = useAppConfig()
  const config = resolveCmsGlobalSeoConfig((appConfig.cmsGlobalSeo || {}) as CmsGlobalSeoConfig)
  const defaults = useState<CmsGlobalSeo | null>('cms-global-seo', () => null)

  // Register head synchronously before any await so Nuxt keeps plugin context.
  useHead(
    () => {
      if (
        !config.enabled ||
        defaults.value === null ||
        isIgnoredPath(route.path, config) ||
        isDrupalRoute(route, config)
      ) {
        return {}
      }

      return {
        htmlAttrs: defaults.value.lang ? { lang: defaults.value.lang } : undefined,
        link: withLinkKeys(defaults.value.link),
        meta: withMetaKeys(defaults.value.meta),
      }
    },
    {
      tagPriority: 'low',
    },
  )

  if (defaults.value === null) {
    defaults.value = await $fetch<CmsGlobalSeo>('/api/seo/global').catch(() => ({
      meta: [],
      link: [],
    }))
  }
})
