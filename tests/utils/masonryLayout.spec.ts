import { describe, expect, it } from 'vitest'
import {
  assignMasonryLanes,
  masonryGridStyle,
  masonryItemStyles,
  masonryRowSpan,
} from '../../layers/theme/app/utils/masonryLayout'

describe('masonry layout', () => {
  it('spans rows from the aspect ratio, 16:9 without a size', () => {
    expect(masonryRowSpan({ width: 400, height: 600 })).toBe(150)
    expect(masonryRowSpan({ width: 300, height: 200 })).toBe(67)
    expect(masonryRowSpan({})).toBe(57)
  })

  it('places each item in the shortest lane, the first on a tie', () => {
    expect(assignMasonryLanes([150, 67, 100, 67, 67], 3)).toEqual([1, 2, 3, 2, 3])
    expect(assignMasonryLanes([10, 10], 1)).toEqual([1, 1])
  })

  it('sets lanes and gaps per configured breakpoint', () => {
    expect(masonryGridStyle({ lanes: { default: 2, lg: 4 }, gap: { default: 8 } })).toEqual({
      '--masonry-lanes-default': '2',
      '--masonry-lanes-lg': '4',
      '--masonry-gap-default': '8px',
    })
  })

  it('gives each item a span and a lane for every configured lane count', () => {
    const styles = masonryItemStyles(
      [{ width: 100, height: 150 }, { width: 100, height: 100 }, { width: 100, height: 50 }],
      { lanes: { default: 1, md: 2 } },
    )

    expect(styles).toEqual([
      { 'gridRowEnd': 'span 150', '--masonry-lane-default': '1', '--masonry-lane-md': '1' },
      { 'gridRowEnd': 'span 100', '--masonry-lane-default': '1', '--masonry-lane-md': '2' },
      { 'gridRowEnd': 'span 50', '--masonry-lane-default': '1', '--masonry-lane-md': '2' },
    ])
  })
})
