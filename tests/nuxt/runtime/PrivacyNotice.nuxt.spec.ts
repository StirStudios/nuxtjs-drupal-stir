import { useAppConfig } from '#imports'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import PrivacyNotice from '../../../layers/integrations/app/components/PrivacyNotice.vue'

const noticeConfig = () => useAppConfig().privacyNotice as Record<string, unknown>
let original: Record<string, unknown> = {}

async function mountAt(path: string) {
  const wrapper = await mountSuspended(PrivacyNotice, { route: path })

  await nextTick()
  return wrapper
}

beforeEach(() => {
  original = { ...noticeConfig() }
  document.cookie.split(';').forEach((cookie) => {
    document.cookie = `${cookie.split('=')[0]?.trim()}=; max-age=0; path=/`
  })
  Object.assign(noticeConfig(), {
    enabled: true,
    mode: 'consent',
    title: 'Cookies',
    message: 'We use cookies.',
  })
})

afterEach(() => {
  Object.assign(noticeConfig(), original)
})

describe('PrivacyNotice', () => {
  it('shows the floating card by default', async () => {
    const wrapper = await mountAt('/')
    const dialog = wrapper.find('[role="dialog"]')

    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-label')).toBe('Cookies')
    expect(dialog.classes()).toContain('bottom-3')
    expect(dialog.classes()).not.toContain('max-md:inset-x-0')
    wrapper.unmount()
  })

  it('stays off ignored paths and prefixes without recording a decision', async () => {
    Object.assign(noticeConfig(), {
      ignoredPaths: ['/pricing/checkout'],
      ignoredPathPrefixes: ['/onboarding'],
    })

    for (const path of ['/pricing/checkout/', '/onboarding', '/onboarding/training']) {
      const wrapper = await mountAt(path)

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      wrapper.unmount()
    }
    expect(document.cookie).toBe('')

    const wrapper = await mountAt('/pricing')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders a compact full-width bar on phones when configured', async () => {
    noticeConfig().mobilePresentation = 'bar'

    const wrapper = await mountAt('/')
    const dialog = wrapper.find('[role="dialog"]')

    expect(dialog.attributes('aria-live')).toBe('polite')
    expect(dialog.classes()).toEqual(expect.arrayContaining(['bottom-0', 'max-md:inset-x-0']))
    expect(dialog.html()).toContain('max-md:max-h-[20vh]')
    expect(wrapper.findAll('button').map(button => button.text() || button.attributes('aria-label')))
      .toEqual(['Dismiss cookie notice', 'Decline', 'Got it'])
    wrapper.unmount()
  })
})
