import { describe, expect, it } from 'vitest'
import { scoreDrupalStructuralDragTarget } from '../../layers/editorial/app/utils/editorDragHandle'

describe('scoreDrupalStructuralDragTarget', () => {
  it('keeps top-level blocks draggable', () => {
    expect(scoreDrupalStructuralDragTarget('paragraph', [])).toBe(0)
    expect(scoreDrupalStructuralDragTarget('heading', [])).toBe(0)
    expect(scoreDrupalStructuralDragTarget('div', [])).toBe(0)
  })

  it('preserves Drupal structural wrappers', () => {
    expect(scoreDrupalStructuralDragTarget('paragraph', ['div'])).toBe(1000)
    expect(
      scoreDrupalStructuralDragTarget('heading', ['section', 'div']),
    ).toBe(1000)
  })

  it('keeps nested list items draggable inside structural wrappers', () => {
    expect(
      scoreDrupalStructuralDragTarget('listItem', ['div', 'bulletList']),
    ).toBe(0)
    expect(
      scoreDrupalStructuralDragTarget('taskItem', ['section', 'taskList']),
    ).toBe(0)
  })
})
