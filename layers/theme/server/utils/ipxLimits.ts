import type { H3Event } from 'h3'

export interface StirIpxLimits {
  /** IPX transforms that may run at once; the rest wait in order. */
  maxConcurrent: number
  /** libvips operation cache in MB; 0 turns it off. */
  sharpCacheMb: number
  /** libvips threads per transform; 0 lets sharp pick one per CPU core. */
  sharpConcurrency: number
}

// Defaults sized for a 1GB pm2 max_memory_restart: a burst of uncached
// gallery sizes otherwise decodes dozens of 3200px masters at once.
export const STIR_IPX_LIMITS: StirIpxLimits = {
  maxConcurrent: 2,
  sharpCacheMb: 0,
  sharpConcurrency: 1,
}

function positiveInteger(value: unknown, fallback: number, minimum: number): number {
  const number = Number(value)

  return Number.isInteger(number) && number >= minimum ? number : fallback
}

export function resolveIpxLimits(config: Partial<Record<keyof StirIpxLimits, unknown>> = {}): StirIpxLimits {
  return {
    maxConcurrent: positiveInteger(config.maxConcurrent, STIR_IPX_LIMITS.maxConcurrent, 1),
    sharpCacheMb: positiveInteger(config.sharpCacheMb, STIR_IPX_LIMITS.sharpCacheMb, 0),
    sharpConcurrency: positiveInteger(config.sharpConcurrency, STIR_IPX_LIMITS.sharpConcurrency, 0),
  }
}

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
