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
export async function buildPresentationCatalogue(presentation: StirPresentationCatalogue | undefined) {
  const catalogue = {
    surfaces: entries(presentation?.surfaces),
    variants: entries(presentation?.variants),
  }
  // Web Crypto, so consumers need no Node type declarations.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(catalogue)))

  return {
    schemaVersion: 1,
    revision: [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join(''),
    ...catalogue,
  }
}
