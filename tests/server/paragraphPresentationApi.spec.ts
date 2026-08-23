import { describe, expect, it } from 'vitest'
import {
  buildParagraphPresentationPath,
  createUpstreamParagraphPresentationError,
} from '../../layers/editorial/server/utils/paragraphPresentationApi'

describe('editorial paragraph presentation API policy', () => {
  it('builds the Drupal CE paragraph presentation endpoint', () => {
    expect(buildParagraphPresentationPath(42)).toBe(
      '/api/drupal-ce/stir-layout-builder/paragraph/42/presentation',
    )
  })

  it('preserves safe upstream 4xx statuses and hides server failures', () => {
    expect(createUpstreamParagraphPresentationError(
      { statusCode: 403 },
    )).toMatchObject({ statusCode: 403 })
    expect(createUpstreamParagraphPresentationError(
      { statusCode: 500 },
    )).toMatchObject({ statusCode: 502 })
  })
})
