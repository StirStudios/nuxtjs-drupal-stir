import { Agent, interceptors, type Dispatcher } from 'undici'

// Connection errors that fail before an answer arrives: a reused keep-alive
// connection the other end has closed, or a server that is reloading.
const RETRY_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'UND_ERR_SOCKET',
])
// A fetch body is a stream that is gone once sent, so only requests without
// one can be sent again.
const REPEATABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const RETRY_DELAY_MS = 250

export function shouldRetryOutbound(method: string, code: string | undefined): boolean {
  return REPEATABLE_METHODS.has(method.toUpperCase()) && Boolean(code && RETRY_ERROR_CODES.has(code))
}

// One retry, on a fresh connection, after a short wait for a reload to finish.
export function createOutboundDispatcher(log: (message: string) => void = console.warn): Dispatcher {
  return new Agent().compose(interceptors.retry({
    maxRetries: 1,
    // An answer, a 503 from Maintenance mode included, is never retried here.
    statusCodes: [],
    retry(error, { state, opts }, callback) {
      const code = (error as { code?: string }).code

      if (state.counter > 1 || !shouldRetryOutbound(String(opts.method), code)) {
        callback(error)
        return
      }

      log(`[stir] retrying ${opts.method} ${opts.origin ?? ''}${opts.path.split('?')[0]} after ${code}`)
      setTimeout(() => callback(null), RETRY_DELAY_MS)
    },
  }))
}
