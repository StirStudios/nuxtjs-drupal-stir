import { describe, expect, it } from 'vitest'
import { toEditableRichTextProps } from '../../layers/theme/app/utils/editableRichText'

describe('toEditableRichTextProps', () => {
  it('maps Drupal text paragraph props and prefers an explicit edit target', () => {
    expect(toEditableRichTextProps({
      id: 7,
      uuid: 'text-7',
      parentUuid: 'layout-1',
      text: '<p>Intro</p>',
      textEdit: { fieldName: 'field_text' },
      editLink: '/edit',
      direction: 'fade-up',
      spacing: 'pb-5',
    }, 'lead')).toEqual({
      id: 7,
      uuid: 'text-7',
      parentUuid: 'layout-1',
      text: '<p>Intro</p>',
      textSource: undefined,
      classes: 'lead',
      direction: 'fade-up',
      editLink: '/edit',
      editTarget: { fieldName: 'field_text' },
    })
    expect(toEditableRichTextProps({ editTarget: 'explicit', textEdit: 'payload' }).editTarget).toBe('explicit')
  })

  it('drops wrongly typed values from blank or malformed payloads', () => {
    expect(toEditableRichTextProps({ id: {}, text: 42, classes: 'prose' })).toEqual({
      id: undefined,
      uuid: undefined,
      parentUuid: undefined,
      text: undefined,
      textSource: undefined,
      classes: 'prose',
      direction: undefined,
      editLink: undefined,
      editTarget: undefined,
    })
  })
})
