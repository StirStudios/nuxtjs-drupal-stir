import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, ref } from 'vue'
import FieldTurnstile from '../../../layers/turnstile/app/components/Field/Turnstile.vue'
import {
  TURNSTILE_BLOCKED_MESSAGE,
  TURNSTILE_WAIT_MS,
  TurnstileTokenError,
  awaitTurnstileToken,
  turnstileState,
} from '../../../layers/turnstile/app/utils/awaitTurnstileToken'

const scriptStatus = ref('loading')

mockNuxtImport('useScriptCloudflareTurnstile', () => () => ({ onLoaded: () => {}, status: scriptStatus }))

const widgetStub = {
  LazyNuxtTurnstile: { props: ['modelValue', 'options'], template: '<div />' },
}

describe('awaitTurnstileToken', () => {
  beforeEach(() => {
    Object.assign(turnstileState, { failures: 0, scriptFailed: false, widgets: 1 })
    scriptStatus.value = 'loading'
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for a token that arrives after the submit', async () => {
    const token = ref('')
    const pending = awaitTurnstileToken(token)

    token.value = 'fresh-token'
    await nextTick()

    await expect(pending).resolves.toBe('fresh-token')
  })

  it('stops waiting as soon as the check reports a failure', async () => {
    const pending = awaitTurnstileToken(ref(''))

    turnstileState.failures += 1

    await expect(pending).rejects.toBeInstanceOf(TurnstileTokenError)
  })

  it('gives up on a check that reports nothing', async () => {
    const pending = awaitTurnstileToken(ref(''))
    const assertion = expect(pending).rejects.toBeInstanceOf(TurnstileTokenError)

    await vi.advanceTimersByTimeAsync(TURNSTILE_WAIT_MS)
    await assertion
  })

  it('does not wait on pages without a check', async () => {
    turnstileState.widgets = 0

    await expect(awaitTurnstileToken(ref(''))).resolves.toBe('')
  })

  it('explains a blocked script and ends a waiting submit', async () => {
    turnstileState.widgets = 0
    const wrapper = await mountSuspended(FieldTurnstile, { global: { stubs: widgetStub } })
    const pending = awaitTurnstileToken(ref(''))

    expect(wrapper.text()).not.toContain(TURNSTILE_BLOCKED_MESSAGE)

    scriptStatus.value = 'error'
    await nextTick()

    await expect(pending).rejects.toBeInstanceOf(TurnstileTokenError)
    expect(wrapper.get('[role="alert"]').text()).toBe(TURNSTILE_BLOCKED_MESSAGE)
    await expect(awaitTurnstileToken(ref(''))).rejects.toBeInstanceOf(TurnstileTokenError)
  })
})
