export async function useDrupalPageRoute(path: string) {
  const { useCeApi, getMessages } = useDrupalCe()
  const nuxtApp = useNuxtApp()
  const route = useRoute()
  const currentPageKey = useState<string>('drupal-ce-current-page-key')
  const normalizedPath = path === '/front' ? '/' : path
  const { data, error } = await useCeApi(normalizedPath, { query: route.query }, true)

  if (error.value) {
    throw createError({
      statusCode: error.value.statusCode ?? 500,
      statusMessage: error.value.statusMessage ?? error.value.message ?? 'Page not found',
    })
  }

  if (data.value?.messages) {
    pushMessages(data.value.messages, getMessages)
  }

  if (data.value?.redirect && !data.value?.content) {
    throw createError({
      statusCode: 404,
      statusMessage:
        'Redirect-only page response cannot be rendered. Verify Drupal page/front configuration.',
    })
  }

  const pageValue = normalizePageData(data.value)
  const pageKey = import.meta.server
    ? '__ssr__'
    : `page-${route.fullPath.split('#')[0].replace(/\/(\?|$)/, '$1')}-proxy`

  nuxtApp.payload.data[pageKey] = pageValue
  currentPageKey.value = pageKey

  const page = computed(() => pageValue)
  const renderablePageContent = computed(() => toRenderableContent(page.value?.content))

  if (route.path === '/' && !renderablePageContent.value) {
    throw createError({
      statusCode: 404,
      statusMessage:
        'Homepage is not configured. Set a valid Drupal front page with renderable content.',
    })
  }

  return {
    page,
    renderablePageContent,
  }
}

function normalizePageData(page: unknown) {
  const value = (page && typeof page === 'object'
    ? page
    : {}) as Record<string, unknown>
  const metatags =
    value.metatags && typeof value.metatags === 'object'
      ? (value.metatags as Record<string, unknown>)
      : {}

  return {
    ...value,
    title: typeof value.title === 'string' ? value.title : '',
    metatags: {
      meta: Array.isArray(metatags.meta) ? metatags.meta : [],
      link: Array.isArray(metatags.link) ? metatags.link : [],
      jsonld: Array.isArray(metatags.jsonld) ? metatags.jsonld : [],
    },
  }
}

function toRenderableContent(content: unknown) {
  if (!content || typeof content === 'string' || Array.isArray(content)) return content || null

  const element = (content as { element?: unknown }).element

  return typeof element === 'string' && element.length > 0 ? content : null
}

function pushMessages(
  messages: unknown,
  getMessages: ReturnType<typeof useDrupalCe>['getMessages'],
) {
  if (!messages || typeof messages !== 'object') return

  const payload = messages as { success?: string[]; error?: string[] }
  const formattedMessages = [
    ...(payload.error ?? []).map((message) => ({ type: 'error', message })),
    ...(payload.success ?? []).map((message) => ({
      type: 'success',
      message,
    })),
  ]

  if (!formattedMessages.length || !import.meta.client) return

  getMessages().value.push(...formattedMessages)
}
