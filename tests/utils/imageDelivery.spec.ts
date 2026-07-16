import { describe, expect, it } from 'vitest'
import {
  resolveImageDeliveryProfile,
  versionImageSource,
} from '../../layers/theme/app/utils/imageDelivery'

describe('versionImageSource', () => {
  it('adds a managed-file revision without changing the original path', () => {
    expect(versionImageSource(
      'https://drupal.example/sites/default/files/photo.jpg',
      '42-1710000000-293400',
    )).toBe(
      'https://drupal.example/sites/default/files/photo.jpg?v=42-1710000000-293400',
    )
  })

  it('replaces a stale revision while preserving other query values and fragments', () => {
    expect(versionImageSource(
      '/files/photo.jpg?download=1&v=old#preview',
      '43-1720000000-300000',
    )).toBe(
      '/files/photo.jpg?download=1&v=43-1720000000-300000#preview',
    )
  })

  it('returns an unversioned source when revision metadata is unavailable', () => {
    expect(versionImageSource('/files/photo.jpg', undefined)).toBe('/files/photo.jpg')
    expect(versionImageSource(undefined, '42-1710000000-293400')).toBeUndefined()
  })
})

describe('resolveImageDeliveryProfile', () => {
  const profiles = {
    card: 'sm:100vw md:50vw lg:33vw xl:400px',
    hero: 'sm:100vw md:100vw lg:100vw xl:100vw',
  }

  it('prefers the hero profile for hero context', () => {
    expect(resolveImageDeliveryProfile('card', true, profiles)).toBe(profiles.hero)
  })

  it('uses a known Drupal responsive style and rejects unknown styles', () => {
    expect(resolveImageDeliveryProfile('card', false, profiles)).toBe(profiles.card)
    expect(resolveImageDeliveryProfile('unknown', false, profiles)).toBeUndefined()
  })
})
