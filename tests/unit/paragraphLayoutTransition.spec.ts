import { describe, expect, it } from 'vitest'
import {
  areParagraphLayoutMappingsValid,
  createParagraphLayoutMappings,
} from '../../layers/theme/app/utils/paragraphLayoutTransition'
import type { ParagraphLayoutOption } from '../../layers/theme/app/types/Presentation'

const option: ParagraphLayoutOption = {
  value: 'two_column',
  label: 'Two column',
  defaultRegion: 'first',
  iconMap: [['first', 'second']],
  regions: [
    { value: 'first', label: 'First' },
    { value: 'second', label: 'Second' },
  ],
  moves: [
    {
      source: 'third',
      sourceLabel: 'Third',
      count: 2,
      suggestedDestination: 'second',
    },
  ],
}

describe('paragraph layout transitions', () => {
  it('starts with Drupal-provided mapping suggestions', () => {
    expect(createParagraphLayoutMappings(option)).toEqual({ third: 'second' })
  })

  it('accepts only target regions exposed by Drupal', () => {
    expect(areParagraphLayoutMappingsValid(option, { third: 'second' })).toBe(true)
    expect(areParagraphLayoutMappingsValid(option, { third: 'fourth' })).toBe(false)
    expect(areParagraphLayoutMappingsValid(option, {})).toBe(false)
  })
})
