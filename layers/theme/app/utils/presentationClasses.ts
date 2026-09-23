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
 * stand for. Content migrated from free-text classes keeps exactly the class
 * strings it had, so the rendered output does not change. Unknown IDs are
 * ignored; without any known choice the legacy free-text classes still apply.
 */
export function resolvePresentationClasses(
  catalogue: StirPresentationCatalogue | undefined,
  choices: { surface?: string, variant?: string },
  legacyClasses?: string,
): string | undefined {
  const chosen = [
    choices.surface ? catalogue?.surfaces?.[choices.surface]?.class : undefined,
    choices.variant ? catalogue?.variants?.[choices.variant]?.class : undefined,
  ].filter(Boolean)

  return chosen.length ? chosen.join(' ') : legacyClasses || undefined
}
