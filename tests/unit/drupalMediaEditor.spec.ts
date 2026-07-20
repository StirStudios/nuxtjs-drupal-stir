// @vitest-environment happy-dom

import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { describe, expect, it } from 'vitest'
import { DrupalMedia } from '../../layers/editorial/app/extensions/DrupalMedia'

describe('DrupalMedia editor extension', () => {
  it('preserves embedded media markup as an atomic, non-editable node', () => {
    const source = [
      '<p>Before</p>',
      '<drupal-media',
      ' class="align-left custom-media"',
      ' data-align="left"',
      ' data-caption="An editorial caption"',
      ' data-entity-type="media"',
      ' data-entity-uuid="15fd4195-edaf-4345-a607-41b22000dbfb"',
      ' data-view-mode="media_library"',
      '>&nbsp;</drupal-media>',
      '<p>After</p>',
    ].join('')
    const editor = new Editor({
      content: source,
      extensions: [Document, Paragraph, Text, DrupalMedia],
    })

    const html = editor.getHTML()

    expect(html).toContain('<drupal-media')
    expect(html).toContain('class="align-left custom-media"')
    expect(html).toContain('data-align="left"')
    expect(html).toContain('data-caption="An editorial caption"')
    expect(html).toContain('data-entity-type="media"')
    expect(html).toContain(
      'data-entity-uuid="15fd4195-edaf-4345-a607-41b22000dbfb"',
    )
    expect(html).toContain('data-view-mode="media_library"')
    expect(editor.schema.nodes.drupalMedia?.spec.selectable).toBe(false)

    editor.destroy()
  })
})
