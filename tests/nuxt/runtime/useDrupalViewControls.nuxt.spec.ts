import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useDrupalViewControls } from '../../../layers/theme/app/composables/useDrupalViewControls'

type RouteQuery = Record<string, string | string[] | undefined>

const state = vi.hoisted(() => ({
  api: vi.fn(),
  legacyApi: vi.fn(),
}))

mockNuxtImport('useDrupalCe', () => {
  return () => ({
    $ceApi: () => state.legacyApi,
  })
})

mockNuxtImport('$fetch', () => state.api)

enableAutoUnmount(afterEach)

const viewProps = {
  paragraphId: 42,
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

const LegacyViewControlsHarness = defineComponent({
  setup() {
    const { paragraphId: _paragraphId, ...legacyProps } = viewProps

    return useDrupalViewControls(legacyProps)
  },
  template: '<div />',
})

const NamespacedViewControlsHarness = defineComponent({
  setup() {
    return useDrupalViewControls({
      ...viewProps,
      queryNamespace: 'articles',
    })
  },
  template: '<div />',
})

const NamespacedLegacyViewControlsHarness = defineComponent({
  setup() {
    const { paragraphId: _paragraphId, ...legacyProps } = viewProps

    return useDrupalViewControls({
      ...legacyProps,
      queryNamespace: 'articles',
    })
  },
  template: '<div />',
})

const MultiViewControlsHarness = defineComponent({
  setup() {
    const work = useDrupalViewControls({
      ...viewProps,
      paragraphId: 41,
      viewId: 'work',
      displayId: 'work_grid',
    })
    const testimonials = useDrupalViewControls({
      ...viewProps,
      paragraphId: 42,
      viewId: 'testimonials',
      displayId: 'carousel',
      pager: {
        current: 0,
        totalPages: 1,
      },
    })

    return {
      changeWorkPage: work.onPageChange,
      testimonialsPage: testimonials.currentPage,
      testimonialsNamespace: testimonials.resolvedQueryNamespace,
      workNamespace: work.resolvedQueryNamespace,
      workPage: work.currentPage,
    }
  },
  template: '<div />',
})

const DuplicateViewControlsHarness = defineComponent({
  setup() {
    const first = useDrupalViewControls({
      ...viewProps,
      paragraphId: 51,
    })
    const second = useDrupalViewControls({
      ...viewProps,
      paragraphId: 52,
    })

    return {
      firstNamespace: first.resolvedQueryNamespace,
      secondNamespace: second.resolvedQueryNamespace,
    }
  },
  template: '<div />',
})

const TwoPaginatedViewsHarness = defineComponent({
  setup() {
    const first = useDrupalViewControls({
      ...viewProps,
      paragraphId: 61,
      viewId: 'work',
    })
    const second = useDrupalViewControls({
      ...viewProps,
      paragraphId: 62,
      viewId: 'work',
    })

    return {
      changeFirstPage: first.onPageChange,
      firstPage: first.currentPage,
      secondPage: second.currentPage,
    }
  },
  template: '<div />',
})

async function resetRoute(query: RouteQuery = {}, path = '/') {
  await useRouter().replace({
    path,
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
    state.legacyApi.mockReset()
    sessionStorage.clear()
    await resetRoute()
  })

  it('builds crawlable page links from the active Drupal View state', async () => {
    const wrapper = await mountSuspended(ViewControlsHarness, {
      route: '/work?campaign=portfolio',
    })

    await nextTick()

    expect(wrapper.vm.pageLink(2)).toEqual({
      path: '/work',
      query: {
        campaign: 'portfolio',
        testimonials_p42_category: 'events',
        testimonials_p42_sort_by: 'created',
        testimonials_p42_sort_order: 'ASC',
        testimonials_p42_page: '1',
      },
    })

    expect(wrapper.vm.pageLink(1)).toEqual({
      path: '/work',
      query: {
        campaign: 'portfolio',
        testimonials_p42_category: 'events',
        testimonials_p42_sort_by: 'created',
        testimonials_p42_sort_order: 'ASC',
      },
    })
  })

  it('applies safe route query values after route changes', async () => {
    state.api.mockResolvedValue(viewResponse(2, 'route-row'))
    const wrapper = await mountSuspended(ViewControlsHarness)

    await resetRoute({
      testimonials_p42_category: 'news',
      testimonials_p42_sort_by: 'created',
      testimonials_p42_sort_order: 'DESC',
      testimonials_p42_page: '2',
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
      testimonials_p42_category: 'news?category=events',
      testimonials_p42_sort_by: 'created?sort_by=title',
      testimonials_p42_sort_order: 'DESC?sort_order=ASC',
      testimonials_p42_page: '2',
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
      testimonials_p42_category: 'news',
      testimonials_p42_sort_by: 'created',
      testimonials_p42_sort_order: 'ASC',
    })
    expect(state.api).toHaveBeenCalledWith(
      '/api/view/42',
      expect.objectContaining({
        query: {
          category: 'news',
          sort_by: 'created',
          sort_order: 'ASC',
        },
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

  it('namespaces public route controls without changing Drupal request keys', async () => {
    state.api.mockResolvedValue(viewResponse(0, 'row-news'))

    const wrapper = await mountSuspended(NamespacedViewControlsHarness)

    await resetRoute({ resources_category: 'events' })

    vi.useFakeTimers()
    wrapper.vm.onFilterChange({ key: 'category', value: 'news' })
    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await flushPromises()

    expect(useRoute().query).toMatchObject({
      articles_category: 'news',
      articles_sort_by: 'created',
      articles_sort_order: 'ASC',
      resources_category: 'events',
    })
    expect(state.api).toHaveBeenCalledWith(
      '/api/view/42',
      expect.objectContaining({
        query: {
          category: 'news',
          sort_by: 'created',
          sort_order: 'ASC',
        },
      }),
    )
  })

  it('automatically isolates a paginated View from a carousel View', async () => {
    state.api.mockResolvedValue(viewResponse(1, 'work-page-2'))
    const wrapper = await mountSuspended(MultiViewControlsHarness)

    await nextTick()
    await flushPromises()
    state.api.mockClear()

    wrapper.vm.changeWorkPage(1)
    await vi.waitFor(() => {
      expect(useRoute().query).toMatchObject({ work_p41_page: '1' })
    })
    await flushPromises()

    expect(wrapper.vm.workNamespace).toBe('work_p41')
    expect(wrapper.vm.testimonialsNamespace).toBe('testimonials_p42')
    expect(wrapper.vm.testimonialsPage).toBe(0)
    expect(useRoute().query).not.toHaveProperty('testimonials_p42_page')
    expect(state.api).toHaveBeenCalledTimes(1)
    expect(state.api).toHaveBeenCalledWith(
      '/api/view/41',
      expect.objectContaining({
        query: {
          category: 'events',
          sort_by: 'created',
          sort_order: 'ASC',
          page: '1',
        },
      }),
    )
  })

  it('restores automatic namespaced state from a direct URL', async () => {
    state.api.mockResolvedValue({ content: [] })
    const wrapper = await mountSuspended(MultiViewControlsHarness, {
      route: '/?work_p41_category=news&work_p41_page=2',
    })

    expect(wrapper.vm.workNamespace).toBe('work_p41')
    expect(useRoute().query).toMatchObject({ work_p41_page: '2' })
    await vi.waitFor(() => expect(wrapper.vm.workPage).toBe(2))

    expect(wrapper.vm.workPage).toBe(2)
    expect(wrapper.vm.testimonialsPage).toBe(0)
    expect(state.api).toHaveBeenCalledTimes(1)
    expect(state.api).toHaveBeenCalledWith(
      '/api/view/41',
      expect.objectContaining({
        query: {
          category: 'news',
          sort_by: 'created',
          sort_order: 'ASC',
          page: '2',
        },
      }),
    )
  })

  it('keeps repeated displays of the same Drupal View independent', async () => {
    const wrapper = await mountSuspended(DuplicateViewControlsHarness)

    expect(wrapper.vm.firstNamespace).toBe('testimonials_p51')
    expect(wrapper.vm.secondNamespace).toBe('testimonials_p52')
    expect(wrapper.vm.firstNamespace).not.toBe(wrapper.vm.secondNamespace)
  })

  it('changes only the selected instance when two paginated Views are present', async () => {
    state.api.mockResolvedValue({ content: [] })
    const wrapper = await mountSuspended(TwoPaginatedViewsHarness)

    state.api.mockClear()

    wrapper.vm.changeFirstPage(2)
    await vi.waitFor(() => {
      expect(useRoute().query).toMatchObject({ work_p61_page: '2' })
    })
    await flushPromises()

    expect(wrapper.vm.firstPage).toBe(2)
    expect(wrapper.vm.secondPage).toBe(0)
    expect(useRoute().query).not.toHaveProperty('work_p62_page')
    expect(state.api).toHaveBeenCalledTimes(1)
    expect(state.api.mock.calls[0]?.[0]).toBe('/api/view/61')
  })

  it('restores only the matching View during back and forward navigation', async () => {
    state.api.mockResolvedValue({ content: [] })
    const wrapper = await mountSuspended(MultiViewControlsHarness)
    const router = useRouter()

    await router.push({ query: { work_p41_page: '1' } })
    await vi.waitFor(() => expect(wrapper.vm.workPage).toBe(1))
    await router.push({ query: { work_p41_page: '2' } })
    await vi.waitFor(() => expect(wrapper.vm.workPage).toBe(2))

    router.back()
    await vi.waitFor(() => expect(wrapper.vm.workPage).toBe(1))
    expect(wrapper.vm.testimonialsPage).toBe(0)

    router.forward()
    await vi.waitFor(() => expect(wrapper.vm.workPage).toBe(2))
    expect(wrapper.vm.testimonialsPage).toBe(0)
  })

  it('restores namespaced route controls independently', async () => {
    state.api.mockResolvedValue(viewResponse(2, 'route-row'))
    const wrapper = await mountSuspended(NamespacedViewControlsHarness)

    await resetRoute({
      articles_category: 'news',
      articles_sort_by: 'created',
      articles_sort_order: 'DESC',
      articles_page: '2',
      resources_page: '4',
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

  it('does not refresh when only another view namespace changes', async () => {
    state.api.mockResolvedValue(viewResponse(1, 'route-row'))
    await mountSuspended(NamespacedViewControlsHarness)
    await nextTick()
    await flushPromises()

    const callsBeforeForeignChange = state.api.mock.calls.length

    await resetRoute({ resources_page: '1' })

    expect(state.api).toHaveBeenCalledTimes(callsBeforeForeignChange)

    await resetRoute({
      articles_page: '1',
      resources_page: '1',
    })

    expect(state.api).toHaveBeenCalledTimes(callsBeforeForeignChange + 1)
  })

  it('does not refresh the outgoing view when the route path changes', async () => {
    state.legacyApi.mockResolvedValue(viewResponse(1, 'route-row'))
    await resetRoute({ articles_page: '1' }, '/a')
    await mountSuspended(NamespacedLegacyViewControlsHarness)
    await nextTick()
    await flushPromises()

    await resetRoute({ articles_page: '1' }, '/b')

    expect(state.legacyApi).not.toHaveBeenCalledWith(
      '/b?category=events&sort_by=created&sort_order=ASC&page=1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
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

  it('keeps full-page refresh only for older payloads without a paragraph id', async () => {
    state.legacyApi.mockResolvedValue(viewResponse(1, 'legacy-row'))
    const wrapper = await mountSuspended(LegacyViewControlsHarness)

    await wrapper.vm.refreshView(1)

    expect(state.legacyApi).toHaveBeenCalledWith(
      '/?category=events&sort_by=created&sort_order=ASC&page=1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(state.api).not.toHaveBeenCalled()
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
