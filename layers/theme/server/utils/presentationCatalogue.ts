import { createHash } from 'node:crypto'
import type { StirPresentationCatalogue } from '../../app/utils/presentationClasses'

type CatalogueEntry = { id: string, label: string }

const entries = (options: StirPresentationCatalogue['surfaces']): CatalogueEntry[] =>
  Object.entries(options || {})
    .map(([id, option]) => ({ id, label: option.label }))
    .sort((left, right) => left.id.localeCompare(right.id))

/**
 * The Surface and Variant choices Drupal offers editors: IDs and labels only,
 * since the classes stay in Nuxt. The revision changes whenever the choices do.
 */
export function buildPresentationCatalogue(presentation: StirPresentationCatalogue | undefined) {
  const catalogue = {
    surfaces: entries(presentation?.surfaces),
    variants: entries(presentation?.variants),
  }

  return {
    schemaVersion: 1,
    revision: createHash('sha256').update(JSON.stringify(catalogue)).digest('hex'),
    ...catalogue,
  }
}
