// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { useRouter } from '#imports'

describe('Drupal page layout on client navigation', () => {
  it('keeps the current layout on every navigation until the next page names its own', async () => {
    const router = useRouter()

    for (const path of ['/layout-one', '/layout-two', '/layout-three']) {
      registerEndpoint(`/api/drupal-ce${path}`, () => ({
        title: path,
        content: {},
        page_layout: 'links',
      }))
    }

    await router.push('/layout-one')
    router.currentRoute.value.meta.layout = 'links'

    // NuxtLayout follows the confirmed route, so its layout must already be
    // set then. Nuxt carries a hydrated layout into one navigation only; the
    // second and later ones depend on the carry-over.
    const confirmed: unknown[] = []
    const stop = router.afterEach(to => confirmed.push(to.meta.layout))

    await router.push('/layout-two')
    await router.push('/layout-three')
    stop()

    expect(confirmed).toEqual(['links', 'links'])
  })

  it('keeps an auth page\'s chrome until the Drupal page it leads to names its layout', async () => {
    const router = useRouter()

    registerEndpoint('/api/drupal-ce/after-auth', () => ({
      title: 'After auth',
      content: {},
      page_layout: 'links',
    }))

    await router.push('/auth/login')
    const auth = router.currentRoute.value.meta
    const confirmed: unknown[] = []
    const stop = router.afterEach(to => confirmed.push([to.meta.layout, to.meta.layoutProps]))

    await router.push('/after-auth')
    stop()

    expect(auth.layout).not.toBeUndefined()
    expect(confirmed).toEqual([[auth.layout, auth.layoutProps]])
  })
})
