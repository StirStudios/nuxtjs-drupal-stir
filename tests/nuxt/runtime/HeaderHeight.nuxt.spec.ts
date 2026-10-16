import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useHeaderHeight } from '../../../layers/theme/app/composables/useHeaderHeight'

const callbacks: Array<() => void> = []
const scrolled = ref(false)
let height = 108

const Probe = defineComponent({
  setup() {
    const el = ref<HTMLElement | null>(null)

    useHeaderHeight(el, scrolled)

    return () => h('header', { ref: el })
  },
})

const published = () => document.documentElement.style.getPropertyValue('--ui-header-height')
const resize = (next: number) => {
  height = next
  callbacks.forEach(callback => callback())
}

beforeEach(() => {
  height = 108
  scrolled.value = false
  callbacks.length = 0
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) {
      callbacks.push(callback)
    }
    observe() {}
    disconnect() {}
  })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => height)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useHeaderHeight', () => {
  it('publishes the measured unscrolled height and follows resizes', async () => {
    const wrapper = await mountSuspended(Probe)

    expect(published()).toBe('108px')
    resize(120)
    expect(published()).toBe('120px')
    wrapper.unmount()
  })

  it('keeps the unscrolled value after the header shrinks while scrolled', async () => {
    const wrapper = await mountSuspended(Probe)

    scrolled.value = true
    await nextTick()
    resize(88)
    expect(published()).toBe('108px')

    scrolled.value = false
    await nextTick()
    height = 108
    callbacks.forEach(callback => callback())
    expect(published()).toBe('108px')
    wrapper.unmount()
  })

  it('removes the variable when the header unmounts', async () => {
    const wrapper = await mountSuspended(Probe)

    wrapper.unmount()
    expect(published()).toBe('')
  })
})
