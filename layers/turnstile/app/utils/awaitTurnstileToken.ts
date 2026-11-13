import { reactive, watch, type Ref } from 'vue'

/**
 * A safety cap for a check that reports nothing at all. Cloudflare's own
 * signals (a token, an error, a timeout, a failed script load) end the wait
 * long before this in practice.
 */
export const TURNSTILE_WAIT_MS = 30_000

export const TURNSTILE_BLOCKED_MESSAGE = 'The security check didn’t finish. An ad or content blocker can stop it: pause it for this site or try another browser, then refresh the page.'

/**
 * Client-side Turnstile state shared with FieldTurnstile. `widgets` counts
 * mounted checks, so forms on pages without one never wait; `failures` counts
 * reported failures, so a wait in progress ends as soon as one is reported.
 */
export const turnstileState = reactive({ failures: 0, scriptFailed: false, widgets: 0 })

/**
 * The security check could not produce a token: it failed, timed out, or
 * its script never loaded (usually a content blocker).
 */
export class TurnstileTokenError extends Error {
  // Read by getFetchErrorMessage(), like a server refusal.
  readonly statusMessage = TURNSTILE_BLOCKED_MESSAGE

  constructor() {
    super('Turnstile token missing')
  }
}

/**
 * Returns the form's Turnstile token, waiting for it when the visitor submits
 * before the check has finished.
 *
 * A fast submit, or a retry straight after a failed one (each attempt spends
 * the token and restarts the check), used to reach the server without a token
 * and fail as "Turnstile verification failed". The wait ends on the check's
 * own signals rather than a fixed delay, so a visitor solving an interactive
 * challenge is not cut off.
 */
export function awaitTurnstileToken(token: Ref<string | undefined>): Promise<string> {
  if (token.value || !turnstileState.widgets) {
    return Promise.resolve(token.value || '')
  }
  if (turnstileState.scriptFailed) {
    return Promise.reject(new TurnstileTokenError())
  }

  return new Promise((resolve, reject) => {
    const finish = (value?: string) => {
      clearTimeout(timer)
      stopToken()
      stopFailure()
      if (value) resolve(value)
      else reject(new TurnstileTokenError())
    }
    const timer = setTimeout(() => finish(), TURNSTILE_WAIT_MS)
    const stopToken = watch(token, (value) => {
      if (value) finish(value)
    })
    const stopFailure = watch(() => turnstileState.failures, () => finish())
  })
}
