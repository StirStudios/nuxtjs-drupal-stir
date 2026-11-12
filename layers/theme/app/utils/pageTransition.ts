export type PageCoverShape = 'circle' | 'square' | 'triangle'

export const PAGE_COVER_DEFAULTS = {
  color: 'var(--ui-primary)',
  shape: 'circle' as PageCoverShape,
  coverDurationMs: 620,
  revealDurationMs: 720,
  ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
  // Where the cover grows from when no pointer started the navigation.
  origin: { x: '100%', y: '0%' },
  // Covers the viewport from any origin.
  radius: '150vmax',
}

// Header z-50 and admin bar z-60 stay above the cover, so they never move.
export const PAGE_COVER_Z_INDEX = 45

/**
 * The clip-path for a cover shape of radius `radius` centred on the origin.
 * Both ends of an animation use the same point count, so browsers interpolate.
 */
export function pageCoverClipPath(
  shape: PageCoverShape,
  origin: { x: string, y: string },
  radius: string,
): string {
  const { x, y } = origin
  const at = (dx: number, dy: number) =>
    `calc(${x} + ${radius} * ${dx}) calc(${y} + ${radius} * ${dy})`

  if (shape === 'square') {
    return `polygon(${at(-1, -1)}, ${at(1, -1)}, ${at(1, 1)}, ${at(-1, 1)})`
  }

  if (shape === 'triangle') {
    // Equilateral, pointing up, with an inscribed circle of `radius`.
    return `polygon(${at(0, -2)}, ${at(1.732, 1)}, ${at(-1.732, 1)})`
  }

  return `circle(${radius} at ${x} ${y})`
}

/** Crossfade styles: the root crossfades, the header and admin bar stay put. */
export function pageCrossfadeCss(durationMs: number): string {
  return [
    '.stir-header{view-transition-name:site-header}',
    '.admin-ui-nav-root{view-transition-name:admin-bar}',
    `::view-transition-old(root),::view-transition-new(root){animation-duration:${durationMs}ms;animation-timing-function:ease-out}`,
    '::view-transition-group(site-header),::view-transition-group(admin-bar){animation:none}',
  ].join('')
}
