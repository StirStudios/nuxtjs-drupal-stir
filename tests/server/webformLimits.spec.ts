import { describe, expect, it } from 'vitest'
import {
  assertWebformContentLength,
  assertWebformMultipartLimits,
  assertWebformRawBodySize,
  getWebformSubmissionLimits,
  type WebformSubmissionLimits,
} from '../../layers/webform/server/utils/webformLimits'

const limits: WebformSubmissionLimits = {
  maxRequestBytes: 100,
  maxFileBytes: 50,
  maxFiles: 2,
  maxFields: 3,
}

describe('webform submission limits', () => {
  it('supports runtime-configured limits', () => {
    expect(getWebformSubmissionLimits({
      webformSubmissionLimits: {
        maxRequestBytes: 200,
        maxFileBytes: 75,
        maxFiles: 3,
        maxFields: 4,
      },
    } as never)).toEqual({
      maxRequestBytes: 200,
      maxFileBytes: 75,
      maxFiles: 3,
      maxFields: 4,
    })
  })

  it('rejects a declared oversized request before parsing', () => {
    const event = {
      node: { req: { headers: { 'content-length': '101' } } },
    } as never

    expect(() => assertWebformContentLength(event, limits)).toThrow(
      expect.objectContaining({ statusCode: 413 }),
    )
  })

  it('rejects an oversized chunked body after reading it', () => {
    expect(() => assertWebformRawBodySize(101, limits)).toThrow(
      expect.objectContaining({ statusCode: 413 }),
    )
  })

  it('rejects oversized files and excessive part counts', () => {
    expect(() => assertWebformMultipartLimits([
      { filename: 'large.pdf', data: { byteLength: 51 } },
    ], limits)).toThrow(expect.objectContaining({ statusCode: 413 }))

    expect(() => assertWebformMultipartLimits([
      { filename: 'one.pdf', data: { byteLength: 1 } },
      { filename: 'two.pdf', data: { byteLength: 1 } },
      { filename: 'three.pdf', data: { byteLength: 1 } },
    ], limits)).toThrow(expect.objectContaining({ statusCode: 413 }))

    expect(() => assertWebformMultipartLimits([
      { name: 'one', data: { byteLength: 1 } },
      { name: 'two', data: { byteLength: 1 } },
      { name: 'three', data: { byteLength: 1 } },
      { name: 'four', data: { byteLength: 1 } },
    ], limits)).toThrow(expect.objectContaining({ statusCode: 413 }))
  })
})
