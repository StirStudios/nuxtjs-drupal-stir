import { describe, expect, it } from 'vitest'
import {
  buildParagraphTextPath,
  createUpstreamParagraphTextError,
  parseParagraphId,
  parseTextValue,
} from '../../layers/editorial/server/utils/paragraphTextApi'

describe('editorial paragraph text API policy', () => {
  it('accepts only positive integer paragraph ids', () => {
    expect(parseParagraphId('42')).toBe(42)

    for (const value of [undefined, '', '0', '-1', '1.5', 'paragraph']) {
      expect(() => parseParagraphId(value)).toThrow('Invalid paragraph id.')
    }
  })

  it('builds the Drupal CE paragraph text endpoint', () => {
    expect(buildParagraphTextPath('/ce-api', 42)).toBe(
      '/api/drupal-ce/ce-api/stir-layout-builder/paragraph/42/text',
    )
  })

  it('preserves safe upstream 4xx statuses and hides server failures', () => {
    expect(createUpstreamParagraphTextError(
      { statusCode: 403 },
      'Read failed.',
    )).toMatchObject({ statusCode: 403, statusMessage: 'Read failed.' })
    expect(createUpstreamParagraphTextError(
      { statusCode: 500 },
      'Read failed.',
    )).toMatchObject({ statusCode: 502, statusMessage: 'Read failed.' })
  })
})

describe('inline text preservation', () => {
  it('leaves optional emptiness and whitespace validation to Drupal', () => {
    expect(parseTextValue('')).toBe('')
    expect(parseTextValue('  text\n')).toBe('  text\n')
    expect(() => parseTextValue(null)).toThrow('Text is required.')
  })

  it('explains revision conflicts without exposing upstream internals', () => {
    expect(createUpstreamParagraphTextError({ statusCode: 409 }, 'Save failed.'))
      .toMatchObject({ statusCode: 409, statusMessage: 'This content has changed or requires editing in Drupal. Reload before trying again.' })
  })
})
