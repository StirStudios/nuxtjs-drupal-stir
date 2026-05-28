import type { RouterOptions } from '@nuxt/schema'

type ScrollPosition = {
  left?: number
  top?: number
  behavior?: ScrollBehavior
}

const SAVED_POSITION_ATTEMPTS = 60
const SAVED_POSITION_TOLERANCE = 8
const SCROLL_DELAY_MS = 100

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve))
}

function canRestoreScrollTop(top: number) {
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight

  return maxScrollY >= top - SAVED_POSITION_TOLERANCE
}

async function waitForSavedPositionHeight(position: ScrollPosition) {
  if (typeof position.top !== 'number') return

  for (let attempt = 0; attempt < SAVED_POSITION_ATTEMPTS; attempt += 1) {
    if (canRestoreScrollTop(position.top)) return

    await nextFrame()
  }
}

export default <RouterOptions>{
  async scrollBehavior(to, from, savedPosition) {
    const offset = 80

    if (savedPosition) {
      await waitForSavedPositionHeight(savedPosition)
      return savedPosition
    }

    await delay(SCROLL_DELAY_MS)

    if (to.hash) {
      const el = document.querySelector(to.hash)

      return el
        ? {
            top: el.getBoundingClientRect().top + window.scrollY - offset,
            behavior: 'smooth' as const,
          }
        : { top: 0 }
    }

    if (to.path === from.path) return false

    return { top: 0 }
  },
}
