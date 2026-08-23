import { describe, expect, it } from 'vitest'
import {
  createParagraphLayoutArrangement,
  createParagraphLayoutGrid,
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

  it('uses Drupal’s icon map to reproduce the selected layout shape', () => {
    const option: ParagraphLayoutOption = {
      ...target,
      regions: [
        { value: 'top', label: 'Top' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
        { value: 'bottom', label: 'Bottom' },
      ],
      iconMap: [
        ['top', 'top'],
        ['left', 'right'],
        ['bottom', 'bottom'],
      ],
    }

    expect(createParagraphLayoutGrid(option)).toEqual({
      container: {
        gridTemplateAreas: '"region1 region1" "region2 region3" "region4 region4"',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      },
      regionAreas: {
        top: 'region1',
        left: 'region2',
        right: 'region3',
        bottom: 'region4',
      },
    })
  })
})
