import type { Ref } from 'vue'

export const TURNSTILE_WAIT_MS = 10_000

export const TURNSTILE_BLOCKED_MESSAGE = 'The security check didn’t finish. An ad or content blocker can stop it: pause it for this site or try another browser, then refresh the page.'

/**
 * The security check produced no token: usually a content blocker or a
 * privacy setting stopped Cloudflare's script from running.
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
 * and fail as "Turnstile verification failed". Sites without a site key skip
 * the wait.
 */
export function awaitTurnstileToken(token: Ref<string | undefined>): Promise<string> {
  if (token.value || !useRuntimeConfig().public.turnstile?.siteKey) {
    return Promise.resolve(token.value || '')
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      stop()
      reject(new TurnstileTokenError())
    }, TURNSTILE_WAIT_MS)
    const stop = watch(token, (value) => {
      if (value) {
        clearTimeout(timer)
        stop()
        resolve(value)
      }
    })
  })
}
