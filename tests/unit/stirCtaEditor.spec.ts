// @vitest-environment happy-dom

import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { describe, expect, it } from 'vitest'
import { StirCta } from '../../layers/editorial/app/extensions/StirCta'

describe('StirCta editor extension', () => {
  it('preserves inline CTA markup as a draggable atomic block', () => {
    const source = [
      '<p>Before</p>',
      '<stir-cta type="classes" data-variant="Class-4"></stir-cta>',
      '<p>After</p>',
    ].join('')
    const editor = new Editor({
      content: source,
      extensions: [Document, Paragraph, Text, StirCta],
    })

    const html = editor.getHTML()

    expect(html).toContain('<stir-cta')
    expect(html).toContain('type="classes"')
    expect(html).toContain('data-variant="Class-4"')
    expect(editor.schema.nodes.stirCta?.spec.selectable).toBe(true)
    expect(editor.schema.nodes.stirCta?.spec.draggable).toBe(true)

    editor.destroy()
  })

  it('shows an editor-only placeholder without changing saved markup', () => {
    const element = document.createElement('div')
    const editor = new Editor({
      element,
      content: '<stir-cta type="classes" data-variant="Class-3"></stir-cta>',
      extensions: [Document, Paragraph, Text, StirCta],
    })

    const placeholder = element.querySelector(
      '[data-stir-cta-placeholder="true"]',
    )

    expect(placeholder?.textContent).toContain('Call to action: Class-3')
    expect(editor.getHTML()).not.toContain('stir-cta-placeholder')
    expect(editor.getHTML()).toContain('<stir-cta')

    editor.destroy()
  })
})
