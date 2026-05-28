import type { RouterOptions } from '@nuxt/schema'

const SAVED_POSITION_ATTEMPTS = 60
const HASH_TARGET_ATTEMPTS = 60
const SAVED_POSITION_TOLERANCE = 8
const SCROLL_OFFSET_TOP = 80

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve))
}

function canRestoreScrollTop(top: number) {
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight

  return maxScrollY >= top - SAVED_POSITION_TOLERANCE
}

async function waitForSavedPositionHeight(top: number) {
  for (let attempt = 0; attempt < SAVED_POSITION_ATTEMPTS; attempt += 1) {
    if (canRestoreScrollTop(top)) return

    await nextFrame()
  }
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getHashElement(hash: string) {
  const rawId = hash.slice(1)
  const decodedId = safeDecodeURIComponent(rawId)

  return document.getElementById(decodedId) || document.getElementById(rawId)
}

async function waitForHashElement(hash: string) {
  for (let attempt = 0; attempt < HASH_TARGET_ATTEMPTS; attempt += 1) {
    const element = getHashElement(hash)

    if (element) return element

    await nextFrame()
  }

  return null
}

export default <RouterOptions>{
  async scrollBehavior(to, from, savedPosition) {
    if (savedPosition && typeof savedPosition.top === 'number') {
      await waitForSavedPositionHeight(savedPosition.top)
      return savedPosition
    }

    if (savedPosition) return savedPosition

    if (to.path === from.path && !to.hash) return false

    if (to.hash) {
      const element = await waitForHashElement(to.hash)

      return element
        ? {
            top: element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_TOP,
            behavior: 'smooth' as const,
          }
        : { top: 0 }
    }

    return { top: 0 }
  },
}
