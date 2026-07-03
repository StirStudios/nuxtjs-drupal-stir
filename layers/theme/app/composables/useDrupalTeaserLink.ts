export interface DrupalTeaserLinkSource {
  id?: string | number
  nid?: string | number
  url?: string
  path?: {
    alias?: string
  }
}

export function resolveDrupalTeaserLink(source: DrupalTeaserLinkSource): string | undefined {
  if (source.url) return source.url
  if (source.path?.alias) return source.path.alias

  const id = source.id || source.nid

  return id ? `/node/${id}` : undefined
}

