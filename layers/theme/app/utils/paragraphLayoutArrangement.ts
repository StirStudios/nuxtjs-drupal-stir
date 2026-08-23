import type {
  ParagraphLayoutChild,
  ParagraphLayoutContract,
  ParagraphLayoutOption,
} from '#stir/types'

export type ParagraphLayoutArrangement = Record<string, ParagraphLayoutChild[]>

export function createParagraphLayoutArrangement(
  contract: ParagraphLayoutContract,
  option: ParagraphLayoutOption,
): ParagraphLayoutArrangement {
  const arrangement = Object.fromEntries(
    option.regions.map(region => [region.value, [] as ParagraphLayoutChild[]]),
  )
  const validRegions = new Set(option.regions.map(region => region.value))
  const mappedRegions = Object.fromEntries(option.moves.map(
    move => [move.source, move.suggestedDestination],
  ))

  for (const child of contract.children ?? []) {
    const region = validRegions.has(child.region)
      ? child.region
      : mappedRegions[child.region] ?? option.defaultRegion

    arrangement[region]?.push({ ...child, region })
  }

  return arrangement
}

export function serializeParagraphLayoutArrangement(
  option: ParagraphLayoutOption,
  arrangement: ParagraphLayoutArrangement,
): Record<string, string[]> {
  return Object.fromEntries(option.regions.map(
    region => [region.value, (arrangement[region.value] ?? []).map(child => child.uuid)],
  ))
}
