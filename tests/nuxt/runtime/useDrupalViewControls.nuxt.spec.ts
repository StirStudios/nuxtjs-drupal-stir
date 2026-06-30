import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useDrupalViewControls } from '../../../layers/theme/app/composables/useDrupalViewControls'

type RouteQuery = Record<string, string | string[] | undefined>

const state = vi.hoisted(() => ({
  api: vi.fn(),
}))

mockNuxtImport('useDrupalCe', () => {
  return () => ({
    $ceApi: () => state.api,
  })
})

const viewProps = {
  viewId: 'testimonials',
  displayId: 'block_1',
  exposedFilters: [
    {
      label: 'Category',
      queryParamName: 'category',
      options: {
        news: 'News',
        events: 'Events',
      },
      submittedValues: ['events'],
    },
  ],
  exposedSorts: [
    {
      label: 'Newest',
      sortByValue: 'created',
      submittedOrder: 'ASC',
      queryParamSortBy: 'sort_by',
      queryParamSortOrder: 'sort_order',
      sortOrderOptions: {
        ASC: 'Ascending',
        DESC: 'Descending',
      },
    },
  ],
  pager: {
    current: 0,
    totalPages: 3,
  },
}

const ViewControlsHarness = defineComponent({
  setup() {
    return useDrupalViewControls(viewProps)
  },
  template: '<div />',
})

async function resetRoute(query: RouteQuery = {}) {
  await useRouter().replace({
    path: '/',
    query,
  })
  await nextTick()
  await flushPromises()
}

function viewResponse(page: number, rowId: string) {
  return {
    content: {
      element: 'drupal-view-default',
      props: {
        viewId: 'testimonials',
        displayId: 'block_1',
        pager: {
          current: page,
          totalPages: 4,
        },
      },
      slots: {
        rows: [
          {
            element: 'node-testimonial-teaser',
            props: {
              id: rowId,
            },
          },
        ],
      },
    },
  }
}

describe('useDrupalViewControls (Nuxt runtime)', () => {
  beforeEach(async () => {
    vi.useRealTimers()
    state.api.mockReset()
    sessionStorage.clear()
    await resetRoute()
  })

  it('applies safe route query values after route changes', async () => {
    state.api.mockResolvedValue(viewResponse(2, 'route-row'))
    const wrapper = await mountSuspended(ViewControlsHarness)

    await resetRoute({
      category: 'news',
      sort_by: 'created',
      sort_order: 'DESC',
      page: '2',
    })
    await nextTick()
    await flushPromises()

    expect(wrapper.vm.filterValues).toEqual({ category: 'news' })
    expect(wrapper.vm.sortValues).toEqual({
      sort_by: 'created',
      sort_order: 'DESC',
    })
    expect(wrapper.vm.currentPage).toBe(2)
  })

  it('falls back to submitted defaults for unsafe route query values after route changes', async () => {
    state.api.mockResolvedValue(viewResponse(2, 'route-row'))
    const wrapper = await mountSuspended(ViewControlsHarness)

    await resetRoute({
      category: 'news?category=events',
      sort_by: 'created?sort_by=title',
      sort_order: 'DESC?sort_order=ASC',
      page: '2',
    })
    await nextTick()
    await flushPromises()

    expect(wrapper.vm.filterValues).toEqual({ category: 'events' })
    expect(wrapper.vm.sortValues).toEqual({
      sort_by: 'created',
      sort_order: 'ASC',
    })
    expect(wrapper.vm.currentPage).toBe(2)
  })

  it('syncs filter changes to the route and refreshes matching Drupal view rows', async () => {
    state.api.mockResolvedValue(viewResponse(0, 'row-news'))

    const wrapper = await mountSuspended(ViewControlsHarness)

    vi.useFakeTimers()
    wrapper.vm.onFilterChange({ key: 'category', value: 'news' })
    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await flushPromises()

    expect(useRoute().query).toMatchObject({
      category: 'news',
      sort_by: 'created',
      sort_order: 'ASC',
    })
    expect(state.api).toHaveBeenCalledWith(
      '/?category=news&sort_by=created&sort_order=ASC',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    )
    expect(wrapper.vm.dynamicRows).toEqual([
      {
        element: 'node-testimonial-teaser',
        props: {
          id: 'row-news',
        },
      },
    ])
    expect(wrapper.vm.currentPage).toBe(0)
  })

  it('uses an empty row fallback when the refreshed page does not contain the view', async () => {
    state.api.mockResolvedValue({ content: [] })

    const wrapper = await mountSuspended(ViewControlsHarness)

    await wrapper.vm.refreshView(1)

    expect(wrapper.vm.dynamicRows).toEqual([])
    expect(wrapper.vm.effectivePager).toEqual({
      current: 1,
      totalPages: 1,
    })
    expect(wrapper.vm.loadError).toBe('')
  })

  it('aborts stale refreshes and ignores late stale responses', async () => {
    const requests: Array<{
      resolve: (value: unknown) => void
      signal?: AbortSignal
    }> = []

    state.api.mockImplementation((_path: string, options: { signal?: AbortSignal }) => {
      return new Promise((resolve) => {
        requests.push({ resolve, signal: options.signal })
      })
    })

    const wrapper = await mountSuspended(ViewControlsHarness)
    const firstRefresh = wrapper.vm.refreshView(1)
    const secondRefresh = wrapper.vm.refreshView(2)

    expect(requests[0]?.signal?.aborted).toBe(true)

    requests[1]?.resolve(viewResponse(2, 'fresh-row'))
    await secondRefresh
    requests[0]?.resolve(viewResponse(1, 'stale-row'))
    await firstRefresh

    expect(wrapper.vm.dynamicRows).toEqual([
      {
        element: 'node-testimonial-teaser',
        props: {
          id: 'fresh-row',
        },
      },
    ])
    expect(wrapper.vm.currentPage).toBe(2)
  })
})
