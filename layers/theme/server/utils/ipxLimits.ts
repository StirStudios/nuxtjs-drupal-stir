import type { H3Event } from 'h3'

/**
 * Holds each request until a slot is free and releases the slot when its
 * response closes, so it wraps IPX's Node handler without replacing it.
 */
export function createIpxLimiter(maxConcurrent: number): (event: H3Event) => Promise<void> {
  const waiting: Array<() => void> = []
  let active = 0

  function release(): void {
    const next = waiting.shift()

    if (next) next()
    else active--
  }

  return async (event) => {
    if (active < maxConcurrent) active++
    else await new Promise<void>((resolve) => waiting.push(resolve))

    const response = event.node.res

    if (response.closed) release()
    else response.once('close', release)
  }
}
