import type { VueHeadClient } from '@unhead/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installNuxtDevtoolsUnheadCompat } from '../../layers/foundation/app/utils/nuxtDevtoolsUnheadCompat'

const { resolveTags } = vi.hoisted(() => ({
  resolveTags: vi.fn(() => [{ tag: 'title', textContent: 'Example' }]),
}))

vi.mock('unhead/utils', () => ({ resolveTags }))

describe('Nuxt DevTools Unhead compatibility', () => {
  beforeEach(() => {
    resolveTags.mockClear()
  })

  it('restores the legacy resolveTags method used by stable Nuxt DevTools', () => {
    const head = {} as VueHeadClient

    installNuxtDevtoolsUnheadCompat(head)

    expect((head as VueHeadClient & { resolveTags: () => unknown }).resolveTags()).toEqual([
      { tag: 'title', textContent: 'Example' },
    ])
    expect(resolveTags).toHaveBeenCalledWith(head)
  })

  it('preserves a resolveTags implementation supplied by Unhead', () => {
    const existingResolveTags = vi.fn(() => [])
    const head = { resolveTags: existingResolveTags } as unknown as VueHeadClient

    installNuxtDevtoolsUnheadCompat(head)

    expect((head as unknown as { resolveTags: () => unknown }).resolveTags)
      .toBe(existingResolveTags)
  })
})
