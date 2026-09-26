export type StirPresentationOption = {
  label: string
  class: string
}

export type StirPresentationCatalogue = {
  surfaces?: Record<string, StirPresentationOption>
  variants?: Record<string, StirPresentationOption>
}

/**
 * Resolves a paragraph's Surface and Variant choices to the classes they
 * stand for. Unknown IDs are ignored.
 */
export function resolvePresentationClasses(
  catalogue: StirPresentationCatalogue | undefined,
  choices: { surface?: string, variant?: string },
): string | undefined {
  const chosen = [
    choices.surface ? catalogue?.surfaces?.[choices.surface]?.class : undefined,
    choices.variant ? catalogue?.variants?.[choices.variant]?.class : undefined,
  ].filter(Boolean)

  return chosen.length ? chosen.join(' ') : undefined
}
