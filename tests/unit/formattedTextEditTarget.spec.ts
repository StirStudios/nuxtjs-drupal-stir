import { describe, expect, it } from 'vitest'
import {
  formattedTextApiPath,
  normalizeFormattedTextEditTarget,
} from '../../layers/theme/app/utils/formattedTextEditTarget'

describe('formatted text edit targets', () => {
  it('normalizes Drupal snake_case payload metadata', () => {
    const target = normalizeFormattedTextEditTarget({
      entity_type: 'node',
      entity_id: '89',
      field_name: 'body',
    })

    expect(target).toEqual({
      entityType: 'node',
      entityId: '89',
      fieldName: 'body',
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
    })
  })

  it('rejects unsafe route segments', () => {
    expect(normalizeFormattedTextEditTarget({
      entity_type: '../node',
      entity_id: '89',
      field_name: 'body',
    })).toBeNull()
  })
})
