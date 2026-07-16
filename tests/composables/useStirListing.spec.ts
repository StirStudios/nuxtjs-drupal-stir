import { afterEach, describe, expect, it, vi } from 'vitest'
import { useStirListing } from '../../layers/listing/app/composables/useStirListing'

describe('useStirListing', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the shared Nuxt boundary and removes empty query controls', async () => {
    const requestFetch = vi.fn().mockResolvedValue({
      schemaVersion: 1,
      listing: 'articles',
      items: [],
    })

    vi.stubGlobal('useRequestFetch', () => requestFetch)
    const listing = useStirListing('articles')

    await listing.list({
      page: 2,
      category: ['news', 'events'],
      search: '',
      ignored: undefined,
    })

    expect(requestFetch).toHaveBeenCalledWith('/api/listings/articles', {
      query: {
        page: 2,
        category: ['news', 'events'],
      },
    })
  })
})
