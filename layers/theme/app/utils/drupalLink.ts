export type DrupalLink = {
  element?: string
  title?: string
  url?: string
  external?: boolean
  linkTitle?: string
  linkUri?: string
  linkResolvableUri?: string
  content?: string
  props?: {
    label?: string
    url?: string
    external?: boolean
  }
}

export function resolveDrupalLink(link?: DrupalLink) {
  const url = link?.url ?? link?.props?.url ?? link?.linkResolvableUri ?? link?.linkUri

  return {
    title: link?.title ?? link?.props?.label ?? link?.linkTitle ?? link?.content,
    url,
    external: link?.external ?? link?.props?.external ?? /^https?:\/\//.test(url || ''),
  }
}
