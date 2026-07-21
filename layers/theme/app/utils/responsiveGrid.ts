const responsiveGridBreakpoints = [
  ['xs', 480],
  ['sm', 640],
  ['md', 768],
  ['lg', 1024],
  ['xl', 1280],
  ['2xl', 1536],
] as const

export function resolveResponsiveGridValue(
  values: Record<string, number> | undefined,
  viewportWidth: number,
  fallback: number,
): number {
  let resolved = values?.default ?? fallback

  for (const [breakpoint, minWidth] of responsiveGridBreakpoints) {
    const value = values?.[breakpoint]

    if (viewportWidth >= minWidth && typeof value === 'number') {
      resolved = value
    }
  }

  return resolved
}
