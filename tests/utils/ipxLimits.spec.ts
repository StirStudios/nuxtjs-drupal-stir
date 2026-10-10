import { EventEmitter } from 'node:events'
import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import {
  STIR_IPX_LIMITS,
  createIpxLimiter,
  resolveIpxLimits,
} from '../../layers/theme/server/utils/ipxLimits'

function fakeEvent() {
  const res = Object.assign(new EventEmitter(), { closed: false })
  const close = () => {
    res.closed = true
    res.emit('close')
  }

  return { event: { node: { res } } as unknown as H3Event, close }
}

describe('resolveIpxLimits', () => {
  it('uses the defaults for missing or invalid values', () => {
    expect(resolveIpxLimits()).toEqual(STIR_IPX_LIMITS)
    expect(resolveIpxLimits({ maxConcurrent: 0, sharpCacheMb: -1, sharpConcurrency: 'x' }))
      .toEqual(STIR_IPX_LIMITS)
  })

  it('accepts env strings', () => {
    expect(resolveIpxLimits({ maxConcurrent: '4', sharpCacheMb: '50', sharpConcurrency: '0' }))
      .toEqual({ maxConcurrent: 4, sharpCacheMb: 50, sharpConcurrency: 0 })
  })
})

describe('createIpxLimiter', () => {
  it('runs at most the limit at once and admits waiters in order as responses close', async () => {
    const limit = createIpxLimiter(2)
    const requests = [fakeEvent(), fakeEvent(), fakeEvent(), fakeEvent()]
    const started: number[] = []

    requests.forEach(({ event }, index) => limit(event).then(() => started.push(index)))
    await Promise.resolve()
    expect(started).toEqual([0, 1])

    requests[1]!.close()
    await new Promise((resolve) => setImmediate(resolve))
    expect(started).toEqual([0, 1, 2])

    requests[0]!.close()
    requests[2]!.close()
    await new Promise((resolve) => setImmediate(resolve))
    expect(started).toEqual([0, 1, 2, 3])
  })

  it('frees the slot of a request whose client already disconnected', async () => {
    const limit = createIpxLimiter(1)
    const first = fakeEvent()
    const second = fakeEvent()
    let secondStarted = false

    const firstDone = limit(first.event)
    const secondDone = limit(second.event).then(() => (secondStarted = true))

    await firstDone
    second.close()
    first.close()
    await secondDone
    expect(secondStarted).toBe(true)

    const third = fakeEvent()
    let thirdStarted = false

    void limit(third.event).then(() => (thirdStarted = true))
    await new Promise((resolve) => setImmediate(resolve))
    expect(thirdStarted).toBe(true)
  })
})
