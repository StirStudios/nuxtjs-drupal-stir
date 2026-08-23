import { describe, expect, it } from 'vitest'
import {
  createParagraphLayoutArrangement,
  serializeParagraphLayoutArrangement,
} from '../../layers/theme/app/utils/paragraphLayoutArrangement'
import type { ParagraphLayoutContract, ParagraphLayoutOption } from '../../layers/theme/app/types/Presentation'

const target: ParagraphLayoutOption = {
  value: 'two_column',
  label: 'Two column',
  defaultRegion: 'first',
  regions: [
    { value: 'first', label: 'First' },
    { value: 'second', label: 'Second' },
  ],
  iconMap: [['first', 'second']],
  moves: [{
    source: 'third',
    sourceLabel: 'Third',
    count: 1,
    suggestedDestination: 'second',
  }],
}

const contract: ParagraphLayoutContract = {
  current: 'three_column',
  ownerRevisionId: 9,
  options: [target],
  children: [
    { uuid: 'a', paragraphId: 1, bundle: 'text', label: 'Text', region: 'first' },
    { uuid: 'b', paragraphId: 2, bundle: 'media', label: 'Media', region: 'third' },
  ],
}

describe('paragraph layout arrangement', () => {
  it('uses Drupal’s suggested destination for a removed populated region', () => {
    const arrangement = createParagraphLayoutArrangement(contract, target)

    expect(arrangement.first?.map(child => child.uuid)).toEqual(['a'])
    expect(arrangement.second?.map(child => child.uuid)).toEqual(['b'])
  })

  it('serializes the complete visible region order', () => {
    const arrangement = createParagraphLayoutArrangement(contract, target)

    arrangement.first?.push(arrangement.second!.shift()!)

    expect(serializeParagraphLayoutArrangement(target, arrangement)).toEqual({
      first: ['a', 'b'],
      second: [],
    })
  })
})
