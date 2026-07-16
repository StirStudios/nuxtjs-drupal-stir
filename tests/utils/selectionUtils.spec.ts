import { describe, expect, it } from 'vitest'
import { syncLinkedSelections } from '../../layers/webform/app/utils/selectionUtils'

describe('syncLinkedSelections', () => {
  it('adds linked options while tolerating normalized Drupal keys', () => {
    expect(syncLinkedSelections(
      ['parent_option'],
      ['parent_option'],
      {
        parent_option: { linkedTo: ['linkedOption'] },
        linked_option: {},
      },
    )).toEqual(['parent_option', 'linked_option'])
  })

  it('removes stale auto-linked options when their parent is deselected', () => {
    expect(syncLinkedSelections(
      [],
      ['linked_option'],
      {
        parent_option: { linked_to: ['linked_option'] },
        linked_option: {},
      },
    )).toEqual([])
  })

  it('keeps a linked option that the user explicitly selected', () => {
    expect(syncLinkedSelections(
      ['linked_option'],
      ['linked_option'],
      {
        parent_option: { linked_to: ['linked_option'] },
        linked_option: {},
      },
    )).toEqual(['linked_option'])
  })

  it('does not add a disabled linked option', () => {
    expect(syncLinkedSelections(
      ['parent_option'],
      ['parent_option'],
      {
        parent_option: { linked_to: ['linked_option'] },
        linked_option: {},
      },
      new Set(['linked_option']),
    )).toEqual(['parent_option'])
  })
})
