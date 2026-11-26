import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import EditText from '../../../layers/editorial/app/components/Edit/Text.vue'
import { editorNestedDragHandleOptions } from '../../../layers/editorial/app/utils/editorDragHandle'

const target = (editorMode: 'formatted' | 'plain' | 'heading') => ({
  entityType: 'paragraph',
  entityId: 7,
  fieldName: 'field_text',
  editorMode,
})

// Tiptap needs a real editor view; the rich-text case checks what Edit/Text
// hands Nuxt UI's editor, not Tiptap itself.
const editorStub = defineComponent({ template: '<div data-editor><slot :editor="null" /></div>' })
const dragHandleStub = defineComponent({ props: { nested: { type: Object, default: undefined } }, template: '<div data-drag-handle />' })

describe('Edit/Text (Nuxt runtime)', () => {
  it.each([
    ['heading', 'Edit heading'],
    ['plain', 'Edit text'],
  ] as const)('names the %s editor "%s"', async (mode, label) => {
    const wrapper = await mountSuspended(EditText, {
      props: { editTarget: target(mode), sourceText: 'Hello', classes: 'lead text-xl' },
    })

    expect(wrapper.get('textarea').attributes('aria-label')).toBe(label)
  })

  it('keeps the paragraph\'s presentation classes off the editor panel', async () => {
    const wrapper = await mountSuspended(EditText, {
      props: { editTarget: target('plain'), sourceText: 'Hello', classes: 'lead text-xl' },
    })
    const panel = wrapper.get('.admin-ui-panel')

    expect(panel.classes()).not.toContain('lead')
    expect(panel.classes()).not.toContain('text-xl')
  })

  it('lets nested list items be dragged without unwrapping Drupal containers', async () => {
    const wrapper = await mountSuspended(EditText, {
      props: { editTarget: target('formatted'), sourceText: '<ul><li>One<ul><li>Two</li></ul></li></ul>' },
      global: { stubs: { UEditor: editorStub, UEditorDragHandle: dragHandleStub, UEditorToolbar: true, UEditorSuggestionMenu: true } },
    })

    expect(wrapper.getComponent(dragHandleStub).props('nested')).toBe(editorNestedDragHandleOptions)
  })
})
