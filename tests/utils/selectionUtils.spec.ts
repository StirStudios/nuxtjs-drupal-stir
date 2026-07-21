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
        parent_option: { linkedTo: ['linked_option'] },
        linked_option: {},
      },
    )).toEqual([])
  })

  it('keeps a linked option that the user explicitly selected', () => {
    expect(syncLinkedSelections(
      ['linked_option'],
      ['linked_option'],
      {
        parent_option: { linkedTo: ['linked_option'] },
        linked_option: {},
      },
    )).toEqual(['linked_option'])
  })

  it('does not add a disabled linked option', () => {
    expect(syncLinkedSelections(
      ['parent_option'],
      ['parent_option'],
      {
        parent_option: { linkedTo: ['linked_option'] },
        linked_option: {},
      },
      new Set(['linked_option']),
    )).toEqual(['parent_option'])
  })

  it('keeps the latest mutually exclusive option and optional add-ons', () => {
    const properties = {
      coordination_only: { exclusiveWith: ['0-65', '66-130'] },
      '0-65': { exclusiveWith: ['coordination_only'] },
      '66-130': { exclusiveWith: ['coordination_only'] },
      offsite_ceremony: { linkedTo: ['0-65', '66-130'] },
    }

    expect(syncLinkedSelections(
      ['coordination_only', '66-130', 'offsite_ceremony'],
      ['coordination_only', '66-130', 'offsite_ceremony'],
      properties,
      new Set(),
      ['66-130', 'offsite_ceremony'],
    )).toEqual(['coordination_only', 'offsite_ceremony'])

    expect(syncLinkedSelections(
      ['coordination_only', '66-130', 'offsite_ceremony'],
      ['coordination_only', '66-130', 'offsite_ceremony'],
      properties,
      new Set(['0-65']),
      ['coordination_only', 'offsite_ceremony'],
    )).toEqual(['66-130', 'offsite_ceremony'])
  })
})
