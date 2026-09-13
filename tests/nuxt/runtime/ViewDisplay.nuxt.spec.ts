import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import type { DrupalViewControlsSlotProps } from '../../../layers/theme/app/types/View'
import DrupalViewDefault from '../../../layers/theme/app/components/global/drupal-view--default.vue'

const state = vi.hoisted(() => ({
  api: vi.fn(),
}))

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

function viewResponse(page: number) {
  return {
    content: {
      element: 'drupal-view-default',
      props: {
        viewId: 'testimonials',
        displayId: 'block_1',
        pager: { current: page, totalPages: 4 },
      },
      slots: {
        rows: [{ element: 'stir-test-row', props: { id: `row-${page}` } }],
      },
    },
  }
}

function mountWithControls(route = '/work') {
  const received: { current?: DrupalViewControlsSlotProps } = {}
  const wrapper = mountSuspended(DrupalViewDefault, {
    route,
    props: viewProps,
    slots: {
      controls: (controls: DrupalViewControlsSlotProps) => {
        received.current = controls

        return h('div', { class: 'custom-controls' }, controls.activeFilters.map(filter =>
          h('button', { 'aria-label': filter.removeLabel, type: 'button' }, filter.label),
        ))
      },
    },
  })

  return { received, wrapper }
}

describe('DrupalViewDisplay controls slot (Nuxt runtime)', () => {
  beforeEach(async () => {
    vi.useRealTimers()
    state.api.mockReset()
    sessionStorage.clear()
    await useRouter().replace({ path: '/' })
  })

  it('keeps the default controls when no slot is provided', async () => {
    const wrapper = await mountSuspended(DrupalViewDefault, {
      route: '/work',
      props: viewProps,
    })

    expect(wrapper.find('section > .mb-6.space-y-4').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('replaces only the controls region and exposes filter state', async () => {
    const { received, wrapper: pending } = mountWithControls()
    const wrapper = await pending

    expect(wrapper.find('section > .mb-6.space-y-4').exists()).toBe(false)
    expect(wrapper.get('.custom-controls button').attributes('aria-label'))
      .toBe('Remove Category: Events')
    expect(wrapper.get('[role="status"]').text()).toBe('')
    expect(received.current).toMatchObject({
      filters: [{ queryParamName: 'category', label: 'Category' }],
      filterValues: { category: 'events' },
      sort: { queryParamSortBy: 'sort_by' },
      sortValues: { sort_by: 'created', sort_order: 'ASC' },
      activeFilters: [{ filterKey: 'category', label: 'Events', value: 'events' }],
      isLoading: false,
    })
    expect(wrapper.findAll('nav a').map(link => link.attributes('href')))
      .toContain('/work?testimonials_p42_category=events&testimonials_p42_sort_by=created&testimonials_p42_sort_order=ASC&testimonials_p42_page=1')
  })

  it('applies slot actions through the shared view state and announces results', async () => {
    state.api.mockResolvedValue(viewResponse(0))

    const { received, wrapper: pending } = mountWithControls()
    const wrapper = await pending
    const controls = () => received.current!

    vi.useFakeTimers()
    controls().setSort({ key: 'sort_order', value: 'DESC' })
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()
    controls().removeFilter(controls().activeFilters[0]!)
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()

    expect(useRoute().query).toMatchObject({
      testimonials_p42_sort_order: 'DESC',
    })
    expect(state.api).toHaveBeenLastCalledWith('/api/view/42', expect.objectContaining({
      query: { sort_by: 'created', sort_order: 'DESC' },
    }))
    expect(controls().activeFilters).toEqual([])
    expect(wrapper.get('[role="status"]').text()).toBe('Results updated')

    controls().resetFilters()
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()

    expect(controls().filterValues).toEqual({ category: 'events' })
    expect(controls().sortValues).toEqual({ sort_by: 'created', sort_order: 'DESC' })

    controls().resetSort()
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()

    expect(controls().sortValues).toEqual({ sort_by: 'created', sort_order: 'ASC' })
    expect(state.api).toHaveBeenLastCalledWith('/api/view/42', expect.objectContaining({
      query: { category: 'events', sort_by: 'created', sort_order: 'ASC' },
    }))
  })

  it('keeps initial page resolution and crawlable pager links with custom controls', async () => {
    state.api.mockResolvedValue(viewResponse(2))

    const { wrapper: pending } = mountWithControls('/work?testimonials_p42_page=2')
    const wrapper = await pending

    await nextTick()

    expect(state.api).toHaveBeenCalledTimes(1)
    expect(state.api).toHaveBeenCalledWith('/api/view/42', expect.objectContaining({
      query: expect.objectContaining({ page: '2' }),
    }))
    expect(wrapper.find('.custom-controls').exists()).toBe(true)

    const destinations = wrapper.findAll('nav a').map(link => link.attributes('href'))

    expect(destinations).toContain('/work?testimonials_p42_category=events&testimonials_p42_sort_by=created&testimonials_p42_sort_order=ASC')
    expect(destinations).toContain('/work?testimonials_p42_category=events&testimonials_p42_sort_by=created&testimonials_p42_sort_order=ASC&testimonials_p42_page=3')
  })
})
