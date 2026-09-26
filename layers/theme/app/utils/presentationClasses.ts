export type StirPresentationOption = {
  label: string
  class: string
  /** A dark choice: Nuxt UI's colour tokens switch to their dark values. */
  colorMode?: 'dark'
}

export type StirPresentationCatalogue = {
  surfaces?: Record<string, StirPresentationOption>
  variants?: Record<string, StirPresentationOption>
}

/**
 * Resolves a paragraph's Surface and Variant choices to the classes they
 * stand for, adding `dark` for a choice with colorMode: 'dark'. Unknown IDs are
 * ignored.
 */
export function resolvePresentationClasses(
  catalogue: StirPresentationCatalogue | undefined,
  choices: { surface?: string, variant?: string },
): string | undefined {
  const options = [
    choices.surface ? catalogue?.surfaces?.[choices.surface] : undefined,
    choices.variant ? catalogue?.variants?.[choices.variant] : undefined,
  ].filter(option => option !== undefined)
  const classes = options.flatMap(option => option.class.split(/\s+/).filter(Boolean))

  if (options.some(option => option.colorMode === 'dark') && !classes.includes('dark')) {
    classes.unshift('dark')
  }
  return classes.length ? classes.join(' ') : undefined
}
