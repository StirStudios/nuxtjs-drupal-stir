// Structured contract mirrored from Drupal's GridItemsConfigHelper::toStructured()
// (stir_layout_builder). Keep the breakpoint list in sync with
// GridItemsConfigHelper's BREAKPOINT_MIN_WIDTHS and with
// layers/theme/app/utils/responsiveGrid.ts.
export const GRID_BREAKPOINTS = ['default', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

export type GridBreakpoint = (typeof GRID_BREAKPOINTS)[number]

export type GridConfig = {
  columns?: Partial<Record<GridBreakpoint, number | string>>
  gap?: Partial<Record<GridBreakpoint, number>>
  matrix?: true
}

/**
 * Builds Tailwind classes from structured grid config.
 *
 * The one place Drupal's column/gap values become Tailwind classes.
 * Returns an empty string when `grid` is undefined (nothing authored) so
 * a bare WrapGrid renders no extra wrapper element at all. Once any grid
 * config is present, `mode: 'grid'` renders CSS grid columns (defaulting
 * to a single column at the base breakpoint when unset there);
 * `mode: 'carousel'` renders embla slide-basis fractions instead, since a
 * carousel lays out items as flex slides, not a CSS grid. A string
 * column value (e.g. "[8fr_4fr]") is a Tailwind arbitrary
 * grid-template-columns value from one of Drupal's hardcoded layout
 * presets — never produced by the editable grid_items widget — and only
 * applies to `mode: 'grid'`.
 */
export function resolveGridClasses(grid: GridConfig | undefined, mode: 'grid' | 'carousel' = 'grid'): string {
  if (!grid) return ''

  const classes: string[] = []

  if (mode === 'grid') {
    classes.push('grid')
    if (!grid.columns?.default) {
      classes.push('grid-cols-1')
    }
  }

  for (const breakpoint of GRID_BREAKPOINTS) {
    const prefix = breakpoint === 'default' ? '' : `${breakpoint}:`
    const columns = grid?.columns?.[breakpoint]

    if (columns !== undefined) {
      classes.push(mode === 'carousel'
        ? `${prefix}${columns === 1 ? 'basis-full' : `basis-1/${columns}`}`
        : `${prefix}grid-cols-${columns}`)
    }

    const gap = grid?.gap?.[breakpoint]

    if (typeof gap === 'number' && gap > 0) {
      classes.push(`${prefix}gap-${gap}`)
    }
  }

  return classes.join(' ')
}

/**
 * Returns the largest numeric column count set across breakpoints.
 *
 * Ignores non-numeric (arbitrary Tailwind value) columns, since those
 * describe a fixed-ratio split, not a count.
 */
export function maxGridColumns(grid: GridConfig | undefined): number {
  const values = Object.values(grid?.columns ?? {}).filter(
    (value): value is number => typeof value === 'number',
  )

  return values.length > 0 ? Math.max(...values) : 0
}

export type AlignAxisValue = 'start' | 'center' | 'end'

export type AlignConfig = {
  justify?: AlignAxisValue
  items?: AlignAxisValue
  text?: AlignAxisValue
}

/**
 * Builds Tailwind flex/text utility classes from structured alignment.
 *
 * The one place Drupal's align field values become Tailwind classes,
 * shared by every component that reads a paragraph's `align` prop.
 */
export function resolveAlignClasses(align: AlignConfig | undefined): string {
  if (!align) return ''

  const classes: string[] = []

  if (align.justify) classes.push(`justify-${align.justify}`)
  if (align.items) classes.push(`items-${align.items}`)
  if (align.justify || align.items) classes.unshift('md:flex')
  if (align.text) classes.push(`text-${align.text}`)

  return classes.join(' ')
}

export const WIDTH_MAX_WIDTH_CLASSES: Record<string, string> = {
  xs: 'sm:max-w-lg',
  sm: 'lg:max-w-2xl',
  md: 'lg:max-w-3xl',
  lg: 'lg:max-w-4xl',
  xl: 'lg:max-w-5xl',
  '2xl': 'lg:max-w-6xl',
}

/**
 * Builds Tailwind width/centering classes from a width size token.
 *
 * The one place the width-to-class mapping lives, including whether to
 * auto-center the block: `mx-auto` (horizontal only, so it never fights a
 * container's own `mx-auto`) is dropped when the paragraph's own alignment
 * already justifies it left/right, so the two never conflict.
 */
export function resolveWidthClasses(width: string | undefined, align: AlignConfig | undefined): string {
  const maxWidth = width ? WIDTH_MAX_WIDTH_CLASSES[width] : undefined

  if (!maxWidth) return ''

  const directional = align?.justify === 'start' || align?.justify === 'end'

  return directional ? maxWidth : `mx-auto ${maxWidth}`
}
