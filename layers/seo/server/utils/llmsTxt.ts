import type { SitemapEntry } from '../../shared/types/sitemap'
import type { PageSummary } from '../../shared/types/pageSummary'

export const LLMS_TXT_MAX_PAGES = 25

export interface LlmsTxtMenuItem {
  title?: string
  relative?: string
  alias?: string
  url?: string
  absolute?: string
}

export interface LlmsTxtLinks {
  menu: { url: string, title: string }[]
  pages: string[]
}

export interface LlmsTxtInput {
  name: string
  slogan: string
  siteUrl: string
  links: LlmsTxtLinks
  summaries: PageSummary[]
}

const singleLine = (value: string | null | undefined): string => (value || '').replace(/\s+/g, ' ').trim()

// Sign-in and account pages are kept out, as they are from the sitemap.
const PRIVATE_PATH = /^\/(?:auth|account|login)(?:\/|$)/

const absoluteUrl = (path: string, siteUrl: string): string | null => {
  try {
    const url = new URL(path, siteUrl || undefined)

    url.hash = ''

    return PRIVATE_PATH.test(url.pathname) ? null : url.href
  }
  catch {
    return null
  }
}

export const llmsTxtPath = (url: string): string => new URL(url).pathname

// Summaries describe this site's pages, so links elsewhere get none.
export const isSiteUrl = (url: string, siteUrl: string): boolean =>
  !siteUrl || new URL(url).origin === new URL(siteUrl).origin

const link = (title: string, url: string, description?: string): string =>
  `- [${title.replace(/[[\]]/g, '')}](${url})${description ? `: ${description}` : ''}`

const depth = (url: string): number => llmsTxtPath(url).split('/').filter(Boolean).length

// Main menu links first, then sitemap pages other than the home page (the
// file's own summary): shallowest path, then highest priority, so landing
// pages come before the many items they list (a site may rank every item page
// above its landing pages for search).
export function collectLlmsTxtLinks(
  menu: LlmsTxtMenuItem[],
  sitemap: SitemapEntry[],
  siteUrl: string,
): LlmsTxtLinks {
  const menuLinks = new Map<string, string>()

  for (const item of menu) {
    const title = singleLine(item.title)
    const url = absoluteUrl(item.relative || item.alias || item.url || item.absolute || '', siteUrl)

    if (title && url && !menuLinks.has(url)) menuLinks.set(url, title)
  }

  const pages = sitemap
    .map(entry => ({ url: absoluteUrl(entry.loc, siteUrl), priority: entry.priority ?? 0.5 }))
    .filter((entry): entry is { url: string, priority: number } =>
      entry.url !== null && !menuLinks.has(entry.url) && depth(entry.url) > 0)
    .sort((a, b) => depth(a.url) - depth(b.url) || b.priority - a.priority)
    .map(entry => entry.url)

  return {
    menu: [...menuLinks].map(([url, title]) => ({ url, title })),
    pages: [...new Set(pages)].slice(0, LLMS_TXT_MAX_PAGES),
  }
}

export function buildLlmsTxt({ name, slogan, siteUrl, links, summaries }: LlmsTxtInput): string {
  const byPath = new Map(summaries.map(summary => [summary.path, summary]))
  const summaryOf = (url: string) => isSiteUrl(url, siteUrl) ? byPath.get(llmsTxtPath(url)) : undefined
  const home = byPath.get('/')
  const intro = singleLine(slogan) || singleLine(home?.description)
  const lines = [`# ${singleLine(name) || siteUrl}`]

  if (intro) lines.push('', `> ${intro}`)
  if (home?.description && singleLine(home.description) !== intro) {
    lines.push('', singleLine(home.description))
  }
  if (links.menu.length) {
    lines.push('', '## Main menu', '', ...links.menu.map(({ url, title }) =>
      link(title, url, singleLine(summaryOf(url)?.description))))
  }
  if (links.pages.length) {
    // "Optional" is the llms.txt section readers may skip when short of room.
    lines.push('', '## Optional', '', ...links.pages.map((url) => {
      const summary = summaryOf(url)

      return link(
        singleLine(summary?.title) || decodeURIComponent(llmsTxtPath(url)),
        url,
        singleLine(summary?.description),
      )
    }))
  }

  return `${lines.join('\n')}\n`
}
