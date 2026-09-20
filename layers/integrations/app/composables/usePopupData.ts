import type { PopupNode } from '#stir/types'

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

function findPopupInRegionBlocks(regionBlocks: unknown): PopupNode | null {
  if (!Array.isArray(regionBlocks)) return null

  for (const block of regionBlocks) {
    const paragraphBlocks = isRecord(block) && isRecord(block.slots)
      ? block.slots.paragraphBlock
      : undefined

    for (const entry of Array.isArray(paragraphBlocks) ? paragraphBlocks : []) {
      const found = findPopup(entry)

      if (found) return found
    }
  }

  return null
}

function findPopupInContent(content: unknown): PopupNode | null {
  if (Array.isArray(content)) {
    for (const entry of content) {
      const found = findPopup(entry)

      if (found) return found
    }

    return null
  }

  return findPopup(content)
}

function stringSetting(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string')
}

function numberSetting(...values: unknown[]): number | undefined {
  return values.find((value): value is number => typeof value === 'number' && Number.isFinite(value))
}

export const usePopupData = () => {
  const { getPage } = useStirDrupalCe()
  const page = getPage()
  // Drupal renders the popups region for the requested path with each block's
  // visibility conditions (aliases included) already applied, so nothing is
  // matched against the route here. The footer loads the same app context.
  const { data: popupBlocks } = useAppRegionBlocks('popups')
  const popup = computed<PopupNode | null>(() =>
    findPopupInRegionBlocks(popupBlocks.value)
    ?? findPopupInContent(page.value?.content),
  )

  const config = computed(() => {
    const p = popup.value?.props ?? {}
    const trigger = stringSetting(p.popupTrigger, p.popup_trigger)
    const delay = numberSetting(p.popupDelay, p.popup_delay)
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
      scrollThreshold: scrollThreshold ?? 0.25,
    }
  })

  return { popup, config }
}
