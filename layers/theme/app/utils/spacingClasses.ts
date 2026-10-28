/** The Space above/below steps Drupal stores on every paragraph. */
export const SPACING_STEPS = ['xsmall', 'small', 'medium', 'large'] as const

export type SpacingStep = typeof SPACING_STEPS[number]

export type SpacingScale = Partial<Record<SpacingStep, { top: string, bottom: string }>>

/** The layer's sizes: the classes the old Spacing field rendered. */
export const DEFAULT_SPACING_SCALE: Required<SpacingScale> = {
  xsmall: { top: 'pt-2', bottom: 'pb-2' },
  small: { top: 'pt-5', bottom: 'pb-5' },
  medium: { top: 'pt-10', bottom: 'pb-10' },
  large: { top: 'pt-10 lg:pt-20', bottom: 'pb-10 lg:pb-20' },
}

/**
 * Resolves a paragraph's Space above/below steps to classes, using the
 * project's `stirTheme.presentation.spacing` sizes over the layer's.
 * Unknown steps are ignored.
 */
export function resolveSpacingClasses(
  scale: SpacingScale | undefined,
  top: string | undefined,
  bottom: string | undefined,
): string | undefined {
  const sizes = { ...DEFAULT_SPACING_SCALE, ...scale }
  const classes = [
    top ? sizes[top as SpacingStep]?.top : undefined,
    bottom ? sizes[bottom as SpacingStep]?.bottom : undefined,
  ].filter(Boolean)

  return classes.length ? classes.join(' ') : undefined
}
