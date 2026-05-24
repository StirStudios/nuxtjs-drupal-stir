export type PopupNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

type UnknownRecord = Record<string, unknown>

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

function findPopupInDecoupledBlocks(decoupled: unknown): PopupNode | null {
  if (!isRecord(decoupled)) return null

  for (const block of Object.values(decoupled)) {
    if (!isRecord(block)) continue

    const paragraphBlocks = (block.slots as Record<string, unknown> | undefined)
      ?.paragraphBlock

    if (!Array.isArray(paragraphBlocks)) continue

    for (const entry of paragraphBlocks) {
      const found = findPopup(entry)

      if (found) {
        return found
      }
    }
  }

  return null
}

function findPopupInSources(content: unknown, decoupled: unknown): PopupNode | null {
  if (content) {
    if (Array.isArray(content) && content.length) {
      for (const entry of content) {
        const found = findPopup(entry)

        if (found) {
          return found
        }
      }
    } else {
      const found = findPopup(content)

      if (found) {
        return found
      }
    }
  }

  return findPopupInDecoupledBlocks(decoupled)
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
  const pagePopup = computed(() => findPopupInSources(
    contentSource.value,
    decoupledSource.value,
  ))
  const routePath = computed(() => route.path || '/')

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
    [pagePopup, routePath],
    ([currentPagePopup, path]) => {
      if (currentPagePopup) {
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
