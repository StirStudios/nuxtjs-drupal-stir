import { readFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
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

const MB = 1024 * 1024
// Measured: a burst of 40 uncached sizes from real 1-4MB masters added about
// 100MB whatever the concurrency; larger masters cost more, so budget 64MB
// per transform. The app itself peaks near 400MB on the busiest site.
const TRANSFORM_BUDGET = 64 * MB
const APP_RESERVE = 400 * MB
const MIN_CONCURRENCY = 2
const MAX_CONCURRENCY = 6

/** The cgroup's CPU limit in cores (systemd CPUQuota), if one is set. */
function readCgroupCpus(): number | undefined {
  try {
    const [quota, period] = readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim().split(/\s+/)

    return quota === 'max' || !quota || !period ? undefined : Number(quota) / Number(period)
  }
  catch {
    return undefined
  }
}

/** The cgroup's memory limit in bytes (systemd MemoryMax), if one is set. */
function readCgroupMemoryMax(): number | undefined {
  try {
    const value = readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim()

    return value === 'max' ? undefined : Number(value)
  }
  catch {
    return undefined
  }
}

/**
 * How many IPX transforms run at once, sized to the machine so sites never
 * tune it. Several site processes share a server's cores, so each takes half
 * of what it may use, between 2 and 6, and fewer when its memory limit is
 * too small to hold them beside the app.
 */
export function resolveIpxConcurrency(
  cpus: number = readCgroupCpus() ?? availableParallelism(),
  memoryMax: number | undefined = readCgroupMemoryMax(),
): number {
  const byCpu = Math.floor(cpus / 2)
  const byMemory = memoryMax === undefined
    ? Number.POSITIVE_INFINITY
    : Math.floor((memoryMax - APP_RESERVE) / TRANSFORM_BUDGET)

  return Math.max(MIN_CONCURRENCY, Math.min(MAX_CONCURRENCY, byCpu, byMemory))
}
