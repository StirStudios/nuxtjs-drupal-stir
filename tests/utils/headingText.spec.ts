import { describe, expect, it } from 'vitest'
import { headingTextForEditing, headingTextForSave } from '../../layers/editorial/app/utils/headingText'
import { normalizeFormattedTextEditTarget } from '../../layers/theme/app/utils/formattedTextEditTarget'

describe('heading quick edit', () => {
  it.each(['h2', 'h3', 'h4', 'div', 'span'])('preserves the %s tag while editing the title', (tag) => {
    expect(headingTextForEditing(`${tag}|Original`)).toBe('Original')
    expect(headingTextForSave(`${tag}|Original`, 'New title')).toBe(`${tag}|New title`)
  })

  it('supports untagged and empty headings without leaving an empty tag value', () => {
    expect(headingTextForSave('Original', 'New title')).toBe('New title')
    expect(headingTextForSave('h2|Original', '')).toBe('')
    expect(headingTextForEditing('A | B')).toBe('A | B')
  })

  it('treats an unrecognized prefix as plain text instead of splitting on it', () => {
    expect(headingTextForEditing('h1|Original')).toBe('h1|Original')
    expect(headingTextForEditing('script|Original')).toBe('script|Original')
    expect(headingTextForSave('h1|Original', 'New title')).toBe('New title')
  })

  it('keeps heading mode in the existing edit target contract', () => {
    expect(normalizeFormattedTextEditTarget({entityType: 'paragraph', entityId: 12, fieldName: 'field_header', editorMode: 'heading'})?.editorMode).toBe('heading')
  })
})
