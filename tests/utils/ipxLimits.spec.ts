import { EventEmitter } from 'node:events'
import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import { createIpxLimiter, resolveIpxConcurrency } from '../../layers/theme/server/utils/ipxLimits'

function fakeEvent() {
  const res = Object.assign(new EventEmitter(), { closed: false })
  const close = () => {
    res.closed = true
    res.emit('close')
  }

  return { event: { node: { res } } as unknown as H3Event, close }
}

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

describe('resolveIpxConcurrency', () => {
  const GB = 1024 * 1024 * 1024

  it('takes half the cores, capped at 6, on a shared 12-core server with a 1G unit', () => {
    expect(resolveIpxConcurrency(12, GB)).toBe(6)
  })

  it('never drops below 2', () => {
    expect(resolveIpxConcurrency(1, GB)).toBe(2)
    expect(resolveIpxConcurrency(12, 256 * 1024 * 1024)).toBe(2)
  })

  it('runs fewer when the memory limit is small', () => {
    expect(resolveIpxConcurrency(12, 640 * 1024 * 1024)).toBe(3)
  })

  it('follows the cores alone without a memory limit', () => {
    expect(resolveIpxConcurrency(8, undefined)).toBe(4)
  })
})
