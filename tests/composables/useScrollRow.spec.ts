import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useScrollRow } from '../../layers/theme/app/composables/useScrollRow'

const box = (left: number, width: number) => ({ left, width } as DOMRect)

describe('useScrollRow', () => {
  it('centres an item by scrolling only the row', () => {
    const scrollTo = vi.fn()
    const row = { scrollLeft: 40, clientWidth: 300, scrollTo, addEventListener() {}, removeEventListener() {}, getBoundingClientRect: () => box(16, 300) } as unknown as HTMLElement
    const item = { offsetWidth: 100, getBoundingClientRect: () => box(316, 100) } as unknown as HTMLElement

    effectScope().run(() => useScrollRow(row))!.center(item)

    // 40 already scrolled + 300 from the row's edge - (300 - 100) / 2.
    expect(scrollTo).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' })
  })

  it('does nothing while disabled', () => {
    const scrollTo = vi.fn()
    const row = { scrollLeft: 0, clientWidth: 300, scrollTo, addEventListener() {}, removeEventListener() {}, getBoundingClientRect: () => box(0, 300) } as unknown as HTMLElement
    const item = { offsetWidth: 100, getBoundingClientRect: () => box(400, 100) } as unknown as HTMLElement
    const { fade, center } = effectScope().run(() => useScrollRow(row, false))!

    center(item)
    expect(scrollTo).not.toHaveBeenCalled()
    expect(fade.value).toEqual([])
  })
})
