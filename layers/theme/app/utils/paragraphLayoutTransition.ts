import type { ParagraphLayoutOption } from '#stir/types'

export function createParagraphLayoutMappings(
  option: ParagraphLayoutOption | null,
): Record<string, string> {
  return Object.fromEntries(
    option?.moves.map(move => [move.source, move.suggestedDestination]) ?? [],
  )
}

export function areParagraphLayoutMappingsValid(
  option: ParagraphLayoutOption | null,
  mappings: Record<string, string>,
): boolean {
  return Boolean(option?.moves.every(move => option.regions.some(
    region => region.value === mappings[move.source],
  )))
}
