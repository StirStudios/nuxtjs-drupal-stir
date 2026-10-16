import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useDynamicListingControls } from '../../../layers/theme/app/composables/useDynamicListingControls'

type ControlsOptions = Parameters<typeof useDynamicListingControls>[0]

async function controls(options: ControlsOptions) {
  let result!: ReturnType<typeof useDynamicListingControls>

  await mountSuspended(defineComponent({
    setup() {
      result = useDynamicListingControls(options)

      return () => h('div')
    },
  }))

  return result
}

describe('useDynamicListingControls isFacetDisabled', () => {
  it('keeps the option-count rule when the backend sends no counts', async () => {
    const { isFacetDisabled } = await controls({
      filters: {
        empty: [],
        single: [{ value: 'a', label: 'A' }],
        multiple: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
      },
      totalItems: 10,
    })

    expect(isFacetDisabled('empty')).toBe(true)
    expect(isFacetDisabled('single')).toBe(true)
    expect(isFacetDisabled('multiple')).toBe(false)
  })

  it('enables a lone option that would narrow the results', async () => {
    const { isFacetDisabled } = await controls({
      filters: {
        narrows: [{ value: 'a', label: 'A', count: 4 }],
        everyResult: [{ value: 'b', label: 'B', count: 10 }],
      },
      totalItems: 10,
    })

    expect(isFacetDisabled('narrows')).toBe(false)
    expect(isFacetDisabled('everyResult')).toBe(true)
  })

  it('needs the result total before trusting a count', async () => {
    const { isFacetDisabled } = await controls({
      filters: { narrows: [{ value: 'a', label: 'A', count: 4 }] },
    })

    expect(isFacetDisabled('narrows')).toBe(true)
  })

  it('keeps a facet with a selection enabled', async () => {
    const { isFacetDisabled, updateFilterValues } = await controls({
      filters: { single: [{ value: 'a', label: 'A', count: 10 }] },
      totalItems: 10,
    })

    updateFilterValues('single', ['a'])

    expect(isFacetDisabled('single')).toBe(false)
  })
})

describe('useDynamicListingControls history', () => {
  it('pushes page changes so Back returns to the previous page and replaces filter changes', async () => {
    const { setPage, updateFilterValues } = await controls({
      filters: { category: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
    })
    const router = useRouter()
    const push = vi.spyOn(router, 'push')
    const replace = vi.spyOn(router, 'replace')

    setPage(1)

    expect(push).toHaveBeenCalledWith(expect.objectContaining({ query: { page: '1' } }))
    expect(replace).not.toHaveBeenCalled()

    updateFilterValues('category', ['a'])

    expect(replace).toHaveBeenCalledWith(expect.objectContaining({ query: { category: 'a' } }))
    expect(push).toHaveBeenCalledTimes(1)
  })
})
