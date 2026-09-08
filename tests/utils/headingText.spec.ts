import { describe, expect, it } from 'vitest'
import { headingTextForEditing, headingTextForSave } from '../../layers/editorial/app/utils/headingText'
import { normalizeFormattedTextEditTarget } from '../../layers/theme/app/utils/formattedTextEditTarget'

describe('heading quick edit', () => {
  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])('preserves the %s tag while editing the title', (tag) => {
    expect(headingTextForEditing(`${tag}|Original`)).toBe('Original')
    expect(headingTextForSave(`${tag}|Original`, 'New title')).toBe(`${tag}|New title`)
  })

  it('supports untagged and empty headings without leaving an empty tag value', () => {
    expect(headingTextForSave('Original', 'New title')).toBe('New title')
    expect(headingTextForSave('h2|Original', '')).toBe('')
    expect(headingTextForEditing('A | B')).toBe('A | B')
  })

  it('keeps heading mode in the existing edit target contract', () => {
    expect(normalizeFormattedTextEditTarget({entityType: 'paragraph', entityId: 12, fieldName: 'field_header', editorMode: 'heading'})?.editorMode).toBe('heading')
  })
})
