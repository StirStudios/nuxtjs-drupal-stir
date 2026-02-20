export type PopupNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

type UnknownRecord = Record<string, unknown>

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

export const usePopupData = () => {
  const { page } = usePageContext()
  const popup = ref<PopupNode | null>(null)

  const contentSource = computed(() => page.value?.content)
  const decoupledSource = computed(() => page.value?.blocks?.decoupled)

  watch([contentSource, decoupledSource], ([content, decoupled]) => {
    popup.value = null

    if (content) {
      if (Array.isArray(content) && content.length) {
        for (const entry of content) {
          const found = findPopup(entry)

          if (found) {
            popup.value = found
            break
          }
        }
      } else {
        popup.value = findPopup(content)
      }
    }

    if (popup.value) return
    if (!isRecord(decoupled)) return

    Object.values(decoupled).forEach((block) => {
      if (popup.value) return
      if (!isRecord(block)) return
      const paragraphBlocks = (block.slots as Record<string, unknown>)
        ?.paragraphBlock

      if (!Array.isArray(paragraphBlocks)) return

      for (const entry of paragraphBlocks) {
        const found = findPopup(entry)

        if (found) {
          popup.value = found
          break
        }
      }
    })
  }, { immediate: true })

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
