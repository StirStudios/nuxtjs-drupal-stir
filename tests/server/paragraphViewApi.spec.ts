import { describe, expect, it } from 'vitest'
import {
  buildParagraphViewPath,
  normalizeParagraphViewQuery,
  parseParagraphViewId,
} from '../../layers/theme/server/utils/paragraphViewApi'

describe('paragraph View API helpers', () => {
  it('builds the paragraph-bound Drupal route', () => {
    expect(buildParagraphViewPath('/ce-api', 42)).toBe(
      '/api/drupal-ce/ce-api/stir-layout-builder/paragraph/42/view',
    )
  })

  it('validates paragraph ids', () => {
    expect(parseParagraphViewId('42')).toBe(42)
    expect(() => parseParagraphViewId('view')).toThrowError()
    expect(() => parseParagraphViewId('0')).toThrowError()
  })

  it('keeps bounded scalar and multi-value controls', () => {
    expect(normalizeParagraphViewQuery({
      page: '2',
      category: ['news', 'events'],
      'topics[]': ['one', 'two'],
    })).toEqual({
      page: '2',
      category: ['news', 'events'],
      'topics[]': ['one', 'two'],
    })
  })

  it('rejects unsafe or unbounded controls', () => {
    expect(() => normalizeParagraphViewQuery({ 'bad key': 'value' }))
      .toThrowError()
    expect(() => normalizeParagraphViewQuery({ filter: 'x'.repeat(513) }))
      .toThrowError()
    expect(() => normalizeParagraphViewQuery({
      filter: Array.from({ length: 21 }, () => 'x'),
    })).toThrowError()
  })
})
