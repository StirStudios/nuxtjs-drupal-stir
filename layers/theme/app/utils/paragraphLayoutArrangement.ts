import type {
  ParagraphLayoutChild,
  ParagraphLayoutContract,
  ParagraphLayoutOption,
} from '#stir/types'

export type ParagraphLayoutArrangement = Record<string, ParagraphLayoutChild[]>

export interface ParagraphLayoutGrid {
  container: Record<string, string>
  regionAreas: Record<string, string>
}

export function createParagraphLayoutGrid(option: ParagraphLayoutOption): ParagraphLayoutGrid {
  const fallback = {
    container: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(14rem, 100%), 1fr))',
    },
    regionAreas: {},
  }
  const columns = option.iconMap[0]?.length ?? 0
  const validRegions = new Set(option.regions.map(region => region.value))

  if (columns < 1 || option.iconMap.some(
    row => row.length !== columns || row.some(region => !validRegions.has(region)),
  )) {
    return fallback
  }

  const regionAreas = Object.fromEntries(option.regions.map(
    (region, index) => [region.value, `region${index + 1}`],
  ))
  const rows = option.iconMap.map(row => `"${row.map(region => regionAreas[region]).join(' ')}"`)

  return {
    container: {
      gridTemplateAreas: rows.join(' '),
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    },
    regionAreas,
  }
}

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
