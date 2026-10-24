import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCurrentYear } from '../../../layers/theme/app/composables/useCurrentYear'

describe('useCurrentYear', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces the rendered year with the browser year on mount', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 11, 31))

    let renderedYear = 0
    const wrapper = await mountSuspended(defineComponent({
      setup() {
        const year = useCurrentYear()

        renderedYear = year.value
        // A page cached on 31 December, opened on 1 January.
        vi.setSystemTime(new Date(2027, 0, 1))

        return () => h('span', year.value)
      },
    }))

    expect(renderedYear).toBe(2026)
    expect(wrapper.text()).toBe('2027')
  })
})
