import { layoutContextQuery } from './useLayoutContext'

export type PopupNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

type UnknownRecord = Record<string, unknown>

type VisibilityMode = 'show' | 'hide'

type LayoutBlocksPayload = {
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

function stringSetting(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string')
}

function numberSetting(...values: unknown[]): number | undefined {
  return values.find((value): value is number => typeof value === 'number' && Number.isFinite(value))
}

function booleanSetting(...values: unknown[]): boolean | undefined {
  return values.find((value): value is boolean => typeof value === 'boolean')
}

export const usePopupData = () => {
  const { getPage } = useDrupalCe()
  const page = getPage()
  const route = useRoute()
  const popup = ref<PopupNode | null>(null)
  const fallbackDecoupledSource = ref<unknown>(null)
  const fallbackLoaded = ref(false)
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
  const fallbackPopup = computed(() => {
    if (hasPageDecoupledBlocks.value) return null

    return findPopupInSources(
      undefined,
      fallbackDecoupledSource.value,
      routePath.value,
    )
  })

  async function loadFallbackPopup() {
    if (!import.meta.client) return
    if (fallbackLoaded.value) return

    fallbackLoaded.value = true
    const requestId = ++fallbackRequestId

    try {
      const fallbackPage = await $fetch<LayoutBlocksPayload>('/api/layout-blocks', {
        query: layoutContextQuery(routePath.value),
      })

      if (requestId !== fallbackRequestId) return

      fallbackDecoupledSource.value = fallbackPage?.blocks?.decoupled ?? null
    } catch {
      if (requestId === fallbackRequestId) {
        fallbackDecoupledSource.value = null
      }
    }
  }

  watch(
    routePath,
    () => {
      fallbackLoaded.value = false
      fallbackDecoupledSource.value = null
      fallbackRequestId++
    },
  )

  watch(
    [pagePopup, fallbackPopup],
    ([currentPagePopup, currentFallbackPopup]) => {
      popup.value = currentPagePopup || currentFallbackPopup || null
    },
    { immediate: true },
  )

  watch(
    [pagePopup, hasPageDecoupledBlocks],
    ([currentPagePopup, currentHasPageDecoupledBlocks]) => {
      if (currentPagePopup || currentHasPageDecoupledBlocks) {
        return
      }

      void loadFallbackPopup()
    },
    { immediate: true },
  )

  const config = computed(() => {
    const p = popup.value?.props ?? {}
    const trigger = stringSetting(p.popupTrigger, p.popup_trigger)
    const delay = numberSetting(p.popupDelay, p.popup_delay)
    const showOnce = booleanSetting(p.popupOnce, p.popup_once)
    const scrollThreshold = numberSetting(
      p.popupThreshold,
      p.popupScrollThreshold,
      p.popup_threshold,
      p.popup_scroll_threshold,
    )

    return {
      trigger:
        trigger === 'delay' ||
        trigger === 'scroll' ||
        trigger === 'exit'
          ? trigger
          : 'delay',
      delay: delay ?? 100,
      showOnce: showOnce === true,
      scrollThreshold: scrollThreshold ?? 0.25,
    }
  })

  return { popup, config }
}
