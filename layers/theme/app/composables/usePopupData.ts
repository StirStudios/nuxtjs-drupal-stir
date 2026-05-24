export type PopupNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

type UnknownRecord = Record<string, unknown>

type VisibilityMode = 'show' | 'hide'

type PopupPagePayload = {
  content?: unknown
  blocks?: {
    decoupled?: unknown
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function findPopup(node: unknown): PopupNode | null {
  if (!isRecord(node)) return null

  const stack: unknown[] = [node]

  while (stack.length) {
    const current = stack.pop()

    if (!isRecord(current)) continue

    if (current.element === 'paragraph-popup') {
      return current as PopupNode
    }

    const slots = current.slots

    if (!isRecord(slots)) continue

    for (const slotValue of Object.values(slots)) {
      if (Array.isArray(slotValue)) {
        for (let i = slotValue.length - 1; i >= 0; i--) {
          stack.push(slotValue[i])
        }
      } else {
        stack.push(slotValue)
      }
    }
  }

  return null
}

function normalizeVisibilityRoutePath(path: string): string {
  if (!path || path === '/') return '/'

  return `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

function normalizeVisibilityPattern(pattern: string): string {
  const trimmed = pattern.trim()

  if (!trimmed || trimmed === '<front>') return trimmed

  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

function visibilityPatternMatches(pattern: string, routePath: string): boolean {
  const normalizedPattern = normalizeVisibilityPattern(pattern)

  if (normalizedPattern === '<front>') {
    return routePath === '/'
  }

  if (!normalizedPattern) return false

  const expression = normalizedPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')

  return new RegExp(`^${expression}$`).test(routePath)
}

function getRequestPathVisibility(block: UnknownRecord): { mode: VisibilityMode, paths: string[] } | null {
  const props = block.props

  if (!isRecord(props) || !isRecord(props.visibility)) return null

  const requestPath = props.visibility.requestPath

  if (!isRecord(requestPath)) return null

  const mode = requestPath.mode === 'hide' ? 'hide' : 'show'
  const paths = Array.isArray(requestPath.paths)
    ? requestPath.paths.filter((path): path is string => typeof path === 'string' && path.trim() !== '')
    : []

  if (!paths.length) return null

  return { mode, paths }
}

function blockAllowsRoute(block: UnknownRecord, routePath: string): boolean {
  const visibility = getRequestPathVisibility(block)

  if (!visibility) return true

  const normalizedRoutePath = normalizeVisibilityRoutePath(routePath)
  const matches = visibility.paths.some(path => visibilityPatternMatches(path, normalizedRoutePath))

  return visibility.mode === 'hide' ? !matches : matches
}

function findPopupInDecoupledBlocks(decoupled: unknown, routePath: string): PopupNode | null {
  const stack: unknown[] = [decoupled]

  while (stack.length) {
    const current = stack.pop()

    if (Array.isArray(current)) {
      for (let i = current.length - 1; i >= 0; i--) {
        stack.push(current[i])
      }
      continue
    }

    if (!isRecord(current)) continue

    const slots = current.slots

    if (isRecord(slots)) {
      if (!blockAllowsRoute(current, routePath)) {
        continue
      }

      const paragraphBlocks = slots.paragraphBlock

      if (Array.isArray(paragraphBlocks)) {
        for (const entry of paragraphBlocks) {
          const found = findPopup(entry)

          if (found) {
            return found
          }
        }
      }
    }

    for (const value of Object.values(current)) {
      stack.push(value)
    }
  }

  return null
}

function findPopupInContent(content: unknown): PopupNode | null {
  if (!content) return null

  if (Array.isArray(content) && content.length) {
    for (const entry of content) {
      const found = findPopup(entry)

      if (found) {
        return found
      }
    }

    return null
  }

  return findPopup(content)
}

function hasDecoupledBlocks(decoupled: unknown): boolean {
  return isRecord(decoupled) && Object.keys(decoupled).length > 0
}

function findPopupInSources(content: unknown, decoupled: unknown, routePath: string): PopupNode | null {
  return findPopupInDecoupledBlocks(decoupled, routePath) || findPopupInContent(content)
}

function normalizePopupRoutePath(path: string): string {
  if (!path || path === '/') return ''

  return path.replace(/^\/+/, '').replace(/\/+$/, '')
}

export const usePopupData = () => {
  const { getPage } = useDrupalCe()
  const page = getPage()
  const route = useRoute()
  const popup = ref<PopupNode | null>(null)
  const fallbackPopup = ref<PopupNode | null>(null)
  const fallbackPath = ref<string | null>(null)
  let fallbackRequestId = 0

  const contentSource = computed(() => page.value?.content)
  const decoupledSource = computed(() => page.value?.blocks?.decoupled)
  const hasPageDecoupledBlocks = computed(() => hasDecoupledBlocks(decoupledSource.value))
  const routePath = computed(() => route.path || '/')
  const pagePopup = computed(() => findPopupInSources(
    contentSource.value,
    decoupledSource.value,
    routePath.value,
  ))

  async function loadFallbackPopup(path: string) {
    if (!import.meta.client) return

    const normalizedPath = normalizePopupRoutePath(path)

    if (fallbackPath.value === normalizedPath) return

    fallbackPath.value = normalizedPath
    fallbackPopup.value = null

    const requestId = ++fallbackRequestId

    try {
      const fallbackPage = await $fetch<PopupPagePayload>(
        normalizedPath ? `/api/drupal-ce/${normalizedPath}` : '/api/drupal-ce',
        {
          ignoreResponseError: true,
          query: {
            _content_format: 'json',
          },
        },
      )

      if (requestId !== fallbackRequestId) return

      fallbackPopup.value = findPopupInSources(
        fallbackPage?.content,
        fallbackPage?.blocks?.decoupled,
        path,
      )
    } catch {
      if (requestId === fallbackRequestId) {
        fallbackPopup.value = null
      }
    }
  }

  watch(
    [pagePopup, fallbackPopup],
    ([currentPagePopup, currentFallbackPopup]) => {
      popup.value = currentPagePopup || currentFallbackPopup || null
    },
    { immediate: true },
  )

  watch(
    [pagePopup, routePath, hasPageDecoupledBlocks],
    ([currentPagePopup, path, currentHasPageDecoupledBlocks]) => {
      if (currentPagePopup || currentHasPageDecoupledBlocks) {
        fallbackPopup.value = null
        fallbackPath.value = null
        fallbackRequestId++
        return
      }

      void loadFallbackPopup(path)
    },
    { immediate: true },
  )

  const config = computed(() => {
    const p = popup.value?.props ?? {}

    return {
      trigger:
        p.popupTrigger === 'delay' ||
        p.popupTrigger === 'scroll' ||
        p.popupTrigger === 'exit'
          ? p.popupTrigger
          : 'delay',
      delay: typeof p.popupDelay === 'number' ? p.popupDelay : 100,
      showOnce: p.popupOnce === true,
      scrollThreshold:
        typeof p.popupScrollThreshold === 'number'
          ? p.popupScrollThreshold
          : 0.25,
    }
  })

  return { popup, config }
}
