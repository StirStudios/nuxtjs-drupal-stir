import { describe, expect, it } from 'vitest'
import { resolveImageCdnBase } from '../../layers/theme/build/imageCdn'

describe('resolveImageCdnBase', () => {
  it.each([undefined, '', '   '])('disables CDN delivery for %j', (value) => {
    expect(resolveImageCdnBase(value)).toBeUndefined()
  })

  it('normalizes a CDN origin', () => {
    expect(resolveImageCdnBase(' https://images.example.com/ '))
      .toBe('https://images.example.com')
  })

  it.each([
    'images.example.com',
    'ftp://images.example.com',
    'https://user:secret@images.example.com',
    'https://images.example.com/images',
    'https://images.example.com?variant=test',
  ])('rejects an invalid CDN origin: %s', (value) => {
    expect(() => resolveImageCdnBase(value))
      .toThrow('NUXT_IMAGE_CDN must be an absolute HTTP(S) origin')
  })
})
