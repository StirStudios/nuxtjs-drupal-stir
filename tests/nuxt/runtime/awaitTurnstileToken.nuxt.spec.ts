import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRuntimeConfig } from '#app'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, ref } from 'vue'
import FieldTurnstile from '../../../layers/turnstile/app/components/Field/Turnstile.vue'
import {
  TURNSTILE_BLOCKED_MESSAGE,
  TURNSTILE_WAIT_MS,
  TurnstileTokenError,
  awaitTurnstileToken,
} from '../../../layers/turnstile/app/utils/awaitTurnstileToken'

describe('awaitTurnstileToken', () => {
  let config: { turnstile?: { siteKey?: string } }
  let original: { siteKey?: string } | undefined

  beforeEach(() => {
    config = useRuntimeConfig().public as typeof config
    original = config.turnstile
    config.turnstile = { siteKey: 'site-key' }
    vi.useFakeTimers()
  })

  afterEach(() => {
    config.turnstile = original
    vi.useRealTimers()
  })

  it('waits for a token that arrives after the submit', async () => {
    const token = ref('')
    const pending = awaitTurnstileToken(token)

    token.value = 'fresh-token'
    await nextTick()

    await expect(pending).resolves.toBe('fresh-token')
  })

  it('explains a check that never finishes', async () => {
    const pending = awaitTurnstileToken(ref(''))
    const assertion = expect(pending).rejects.toBeInstanceOf(TurnstileTokenError)

    await vi.advanceTimersByTimeAsync(TURNSTILE_WAIT_MS)
    await assertion
  })

  it('does not wait on sites without Turnstile', async () => {
    config.turnstile = { siteKey: '' }

    await expect(awaitTurnstileToken(ref(''))).resolves.toBe('')
  })

  it('tells the visitor when the check has stalled', async () => {
    const wrapper = await mountSuspended(FieldTurnstile, {
      global: {
        stubs: {
          LazyNuxtTurnstile: { props: ['modelValue', 'options'], template: '<div />' },
        },
      },
    })

    expect(wrapper.text()).not.toContain(TURNSTILE_BLOCKED_MESSAGE)
    await vi.advanceTimersByTimeAsync(TURNSTILE_WAIT_MS)

    expect(wrapper.get('[role="alert"]').text()).toBe(TURNSTILE_BLOCKED_MESSAGE)
  })
})
