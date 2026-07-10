import { describe, expect, it } from 'vitest'
import { trustedDrupalHtml } from '../../layers/theme/app/utils/trustedDrupalHtml'

describe('trustedDrupalHtml', () => {
  it('preserves Drupal-filtered markup exactly', () => {
    const markup = '<p class="lead">Text</p><iframe src="https://example.com" />'

    expect(trustedDrupalHtml(markup)).toBe(markup)
  })

  it('normalizes missing markup to an empty string', () => {
    expect(trustedDrupalHtml()).toBe('')
    expect(trustedDrupalHtml(null)).toBe('')
  })
})
