import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ViewsPagination from '../../../layers/theme/app/components/Drupal/ViewsPagination.vue'

const props = {
  current: 0,
  totalPages: 3,
  to: (page: number) => {
    const query: Record<string, string> = page > 1
      ? { page: String(page - 1) }
      : {}

    return { path: '/work', query }
  },
}

describe('ViewsPagination (Nuxt runtime)', () => {
  it('renders crawlable page destinations in the initial HTML', async () => {
    const html = await renderToString(h(ViewsPagination, props))

    expect(html).toContain('href="/work"')
    expect(html).toContain('href="/work?page=1"')
    expect(html).toContain('href="/work?page=2"')
  })

  it('keeps Nuxt UI pagination controls as ordinary links', async () => {
    const wrapper = await mountSuspended(ViewsPagination, { props })
    const destinations = wrapper.findAll('a').map(link => link.attributes('href'))

    expect(destinations).toContain('/work')
    expect(destinations).toContain('/work?page=1')
    expect(destinations).toContain('/work?page=2')
  })
})
