import { describe, expect, it } from 'vitest'
import { getDrupalOrigin, toDrupalUrl } from '../../layers/theme/app/utils/drupalUrl'

describe('Drupal URL normalization', () => {
  it('uses the configured Drupal origin for root-relative media paths', () => {
    const origin = getDrupalOrigin({
      api: 'https://drupal.example/',
    })

    expect(toDrupalUrl('/sites/default/files/logo.png', origin)).toBe(
      'https://drupal.example/sites/default/files/logo.png',
    )
  })

  it('preserves absolute media URLs', () => {
    expect(toDrupalUrl(
      'https://media.example/logo.png',
      'https://drupal.example',
    )).toBe('https://media.example/logo.png')
  })
})
