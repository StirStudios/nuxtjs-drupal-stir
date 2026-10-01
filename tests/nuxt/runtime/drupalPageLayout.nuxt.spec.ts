// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { useRouter } from '#imports'

function drupalPages(layouts: Record<string, string | undefined>) {
  const requests: string[] = []

  for (const [path, layout] of Object.entries(layouts)) {
    registerEndpoint(`/api/drupal-ce${path}`, () => {
      requests.push(path)

      return { title: path, content: {}, ...(layout ? { page_layout: layout } : {}) }
    })
  }

  return requests
}

describe('Drupal page layout on client navigation', () => {
  it('confirms each navigation in the next page\'s own layout, asking Drupal once', async () => {
    const router = useRouter()
    const requests = drupalPages({
      '/layout-links': 'links',
      '/layout-site': 'clients',
      '/layout-none': undefined,
      '/layout-clear': 'clear',
    })

    // NuxtLayout follows the confirmed route, so its layout must be set then,
    // never by the page after it renders.
    const confirmed: unknown[] = []
    const stop = router.afterEach(to => confirmed.push([to.path, to.meta.layout]))

    for (const path of ['/layout-links', '/layout-site', '/layout-none', '/layout-clear']) {
      await router.push(path)
    }
    stop()

    expect(confirmed).toEqual([
      ['/layout-links', 'links'],
      ['/layout-site', 'clients'],
      ['/layout-none', 'default'],
      ['/layout-clear', 'clear'],
    ])
    expect(requests).toEqual(['/layout-links', '/layout-site', '/layout-none', '/layout-clear'])
  })

  it('drops an auth page\'s chrome for the Drupal page it leads to', async () => {
    const router = useRouter()

    drupalPages({ '/after-auth': 'links' })
    await router.push('/auth/login')
    const confirmed: unknown[] = []
    const stop = router.afterEach(to => confirmed.push([to.meta.layout, to.meta.layoutProps]))

    await router.push('/after-auth')
    stop()

    expect(confirmed).toEqual([['links', undefined]])
  })

  it('applies only the layout of the navigation that wins', async () => {
    const router = useRouter()

    drupalPages({ '/layout-slow': 'links', '/layout-fast': 'clear' })
    const confirmed: unknown[] = []
    const stop = router.afterEach((to, _from, failure) => {
      if (!failure) confirmed.push([to.path, to.meta.layout])
    })

    const slow = router.push('/layout-slow')

    await router.push('/layout-fast')
    await slow
    stop()

    expect(confirmed).toEqual([['/layout-fast', 'clear']])
    expect(router.currentRoute.value.meta.layout).toBe('clear')
  })
})
