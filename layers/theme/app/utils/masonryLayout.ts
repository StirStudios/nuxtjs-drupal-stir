import { GRID_BREAKPOINTS } from './gridClasses'

// One grid row is a hundredth of a lane's width, so an item's row span is its
// height-to-width ratio in percent and needs no measuring.
const ROWS_PER_LANE_WIDTH = 100

export type MasonryConfig = {
  lanes?: Record<string, number>
  gap?: Record<string, number>
}

export type MasonryItemSize = {
  width?: number
  height?: number
}

/** Row span for an item from its intrinsic size, 16:9 when it has none. */
export function masonryRowSpan({ width, height }: MasonryItemSize): number {
  const ratio = Number(width) > 0 && Number(height) > 0 ? Number(height) / Number(width) : 9 / 16

  return Math.max(1, Math.ceil(ratio * ROWS_PER_LANE_WIDTH))
}

/**
 * Places items in the shortest lane (the first on a tie), in order.
 * Returns each item's one-based lane.
 */
export function assignMasonryLanes(spans: number[], lanes: number): number[] {
  const heights = Array.from({ length: Math.max(1, lanes) }, () => 0)

  return spans.map((span) => {
    const lane = heights.indexOf(Math.min(...heights))

    heights[lane]! += span
    return lane + 1
  })
}

/**
 * Inline custom properties for a masonry grid: lane count and gap per
 * configured breakpoint (`--masonry-lanes-md`, `--masonry-gap-md`), read by
 * the `.media-masonry` styles.
 */
export function masonryGridStyle(config: MasonryConfig): Record<string, string> {
  const style: Record<string, string> = {}

  for (const breakpoint of GRID_BREAKPOINTS) {
    const lanes = config.lanes?.[breakpoint]
    const gap = config.gap?.[breakpoint]

    if (typeof lanes === 'number' && lanes > 0) style[`--masonry-lanes-${breakpoint}`] = String(lanes)
    if (typeof gap === 'number' && gap >= 0) style[`--masonry-gap-${breakpoint}`] = `${gap}px`
  }

  return style
}

/**
 * Inline styles for each item: its row span and its lane at every breakpoint
 * that sets a lane count (`--masonry-lane-md`). The browser stacks each lane
 * from the top, so the server markup is the final layout.
 */
export function masonryItemStyles(sizes: MasonryItemSize[], config: MasonryConfig): Record<string, string>[] {
  const spans = sizes.map(masonryRowSpan)
  const styles = spans.map(span => ({ gridRowEnd: `span ${span}` }) as Record<string, string>)

  for (const breakpoint of GRID_BREAKPOINTS) {
    const lanes = config.lanes?.[breakpoint]

    if (typeof lanes !== 'number' || lanes < 1) continue
    assignMasonryLanes(spans, lanes).forEach((lane, index) => {
      styles[index]![`--masonry-lane-${breakpoint}`] = String(lane)
    })
  }

  return styles
}
