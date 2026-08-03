import { describe, expect, it } from 'vitest'
import {
  buildBreadcrumbListSchema,
  buildFaqPageSchema,
} from '../../layers/theme/app/utils/structuredData'

describe('structured data builders', () => {
  it('builds FAQPage data only from complete questions', () => {
    expect(buildFaqPageSchema([
      { question: 'Can goods be relabeled?', answerHtml: '<p>Yes, after review.</p>' },
      { question: 'Missing answer', answerHtml: '' },
    ])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{
        '@type': 'Question',
        name: 'Can goods be relabeled?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '<p>Yes, after review.</p>',
        },
      }],
    })
  })

  it('builds absolute BreadcrumbList items and uses the current URL for the leaf', () => {
    expect(buildBreadcrumbListSchema(
      [
        { label: 'Home', url: '/' },
        { label: 'Services', url: '/services' },
        { label: 'FTZ Warehousing' },
      ],
      'https://example.com',
      'https://example.com/services/ftz-warehousing',
    )).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, item: 'https://example.com/' },
        { position: 2, item: 'https://example.com/services' },
        { position: 3, item: 'https://example.com/services/ftz-warehousing' },
      ],
    })
  })

  it('omits schema when content is not eligible', () => {
    expect(buildFaqPageSchema([])).toBeNull()
    expect(buildBreadcrumbListSchema(
      [{ label: 'Home', url: '/' }],
      'https://example.com',
      'https://example.com',
    )).toBeNull()
  })
})
