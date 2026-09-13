import { describe, expect, it } from 'vitest'
import {
  formattedTextApiPath,
  normalizeFormattedTextEditTarget,
} from '../../layers/theme/app/utils/formattedTextEditTarget'

describe('formatted text edit targets', () => {
  it('normalizes camelCase payload metadata', () => {
    const target = normalizeFormattedTextEditTarget({
      entityType: 'node',
      entityId: '89',
      fieldName: 'body',
      editorMode: 'plain',
    })

    expect(target).toEqual({
      entityType: 'node',
      entityId: '89',
      fieldName: 'body',
      editorMode: 'plain',
    })
    expect(formattedTextApiPath(target!)).toBe(
      '/api/formatted-text/node/89/body',
    )
  })

  it('accepts normalized camelCase metadata', () => {
    expect(normalizeFormattedTextEditTarget({
      entityType: 'paragraph',
      entityId: 168,
      fieldName: 'field_text',
    })).toEqual({
      entityType: 'paragraph',
      entityId: '168',
      fieldName: 'field_text',
      editorMode: 'formatted',
    })
  })

  it('rejects unsafe route segments', () => {
    expect(normalizeFormattedTextEditTarget({
      entityType: '../node',
      entityId: '89',
      fieldName: 'body',
    })).toBeNull()
  })
})
