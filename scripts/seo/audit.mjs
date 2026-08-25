#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { attributes, crawlableUrl, hasNoindex, resolveSiteUrl } from './html.mjs'

const projectRoot = resolve(process.cwd())
const compliance = await readFile(resolve(projectRoot, 'compliance/site.json'), 'utf8')
  .then(value => JSON.parse(value))
  .catch(() => ({}))
const siteUrl = resolveSiteUrl(
  process.env.SEO_SITE_URL || process.env.COMPLIANCE_SITE_URL,
  compliance,
)
const errors = []
const warnings = []
const checkedTargets = new Map()

const error = message => errors.push(message)
const warn = message => warnings.push(message)
const decode = value => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")

function absoluteUrl(value, base) {
  try {
    return new URL(value, base)
  } catch {
    return null
  }
}


async function fetchResource(url) {
  return fetch(url, {
    headers: {
      connection: 'close',
      'user-agent': 'Stir site-health audit',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  }).catch(cause => ({ cause }))
}

function configuredRoutes() {
  const routes = compliance.seo?.auditRoutes ?? compliance.accessibility?.auditRoutes
  return Array.isArray(routes)
    ? routes.filter(route => typeof route === 'string' && route.startsWith('/'))
    : []
}

async function sitemapRoutes() {
  const response = await fetchResource(new URL('/sitemap.xml', siteUrl))
  if (response.cause || !response.ok) {
    warn(`Sitemap could not be read (${response.cause?.message ?? `HTTP ${response.status}`}); using configured audit routes.`)
    return new Set()
  }
  const xml = await response.text()
  return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)]
    .map(match => absoluteUrl(decode(match[1].trim()), siteUrl))
    .filter(url => url?.origin === new URL(siteUrl).origin)
    .map(url => `${url.pathname}${url.search}`))
}

async function checkTarget(url, source, type) {
  const key = url.toString()
  if (!checkedTargets.has(key)) {
    checkedTargets.set(key, (async () => {
      const response = await fetchResource(url)
      if (response.cause) {
        const report = url.origin === new URL(siteUrl).origin ? error : warn
        report(`${type} ${url} from ${source} could not be loaded: ${response.cause.message}`)
        return
      }
      if (!response.ok) {
        const report = url.origin === new URL(siteUrl).origin ? error : warn
        report(`${type} ${url} from ${source} returned HTTP ${response.status}.`)
      }
      if (response.body && !response.bodyUsed) await response.body.cancel()
    })())
  }
  await checkedTargets.get(key)
}

async function auditPage(route, titleOwners, sitemapRouteSet) {
  const requested = new URL(route, siteUrl)
  const response = await fetchResource(requested)
  if (response.cause) {
    error(`${requested} could not be loaded: ${response.cause.message}`)
    return
  }
  if (!response.ok) {
    error(`${requested} returned HTTP ${response.status}.`)
    return
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) {
    error(`${requested} did not return HTML.`)
    return
  }

  const html = await response.text()
  const label = requested.pathname
  const titles = [...html.matchAll(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/gi)]
    .map(match => match[1].replace(/<[^>]*>/g, '').trim())
  if (titles.length !== 1 || !titles[0]) error(`${label} must have exactly one non-empty title.`)
  else if (titleOwners.has(titles[0])) error(`${label} duplicates the title used by ${titleOwners.get(titles[0])}: "${titles[0]}".`)
  else titleOwners.set(titles[0], label)

  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]))
  const robotsContent = [
    ...metaTags.filter(tag => tag.name?.toLowerCase() === 'robots').map(tag => tag.content ?? ''),
    response.headers.get('x-robots-tag') ?? '',
  ].join(',').toLowerCase()
  const noindex = hasNoindex(robotsContent)
  if (noindex && sitemapRouteSet.has(`${requested.pathname}${requested.search}`)) {
    error(`${label} is noindex but appears in the sitemap.`)
  }

  const descriptions = metaTags.filter(tag => tag.name?.toLowerCase() === 'description' && tag.content?.trim())
  if (!noindex && descriptions.length !== 1) error(`${label} must have exactly one non-empty meta description.`)

  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0]))
  const canonicals = linkTags.filter(tag => tag.rel?.toLowerCase().split(/\s+/).includes('canonical'))
  if (!noindex) {
    if (canonicals.length !== 1 || !canonicals[0].href) error(`${label} must have exactly one canonical URL.`)
    else {
      const canonical = absoluteUrl(canonicals[0].href, requested)
      if (!canonical || canonical.origin !== new URL(siteUrl).origin) error(`${label} canonical must use the audited public origin.`)
      else if (canonical.pathname !== requested.pathname) warn(`${label} canonical points to ${canonical.pathname}.`)
    }
  }

  const headings = [...html.matchAll(/<h1\b[^>]*>/gi)]
  if (headings.length !== 1) error(`${label} must render exactly one h1; found ${headings.length}.`)

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const image = attributes(match[0])
    if (!Object.hasOwn(image, 'alt')) error(`${label} contains an image without an alt attribute: ${image.src ?? '(missing src)'}.`)
    if (!image.src) error(`${label} contains an image without a source.`)
    else {
      const url = crawlableUrl(image.src, requested)
      if (url) await checkTarget(url, label, 'Image')
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const anchor = attributes(match[0])
    const url = crawlableUrl(anchor.href, requested)
    if (url) await checkTarget(url, label, url.origin === requested.origin ? 'Internal link' : 'External link')
  }

  for (const match of html.matchAll(/<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[3])
    } catch {
      error(`${label} contains invalid JSON-LD.`)
    }
  }
}

if (!siteUrl || !absoluteUrl(siteUrl, siteUrl)) {
  console.error('ERROR Set owner.domain in compliance/site.json or provide SEO_SITE_URL (or COMPLIANCE_SITE_URL).')
  process.exit(1)
}

const robots = await fetchResource(new URL('/robots.txt', siteUrl))
if (robots.cause || !robots.ok) error(`robots.txt could not be read: ${robots.cause?.message ?? `HTTP ${robots.status}`}.`)

const sitemapRouteSet = await sitemapRoutes()
const routes = [...new Set([...sitemapRouteSet, ...configuredRoutes(), '/'])]
const titleOwners = new Map()
for (const route of routes) await auditPage(route, titleOwners, sitemapRouteSet)

console.log(`Stir SEO audit (${routes.length} route${routes.length === 1 ? '' : 's'})`)
for (const message of warnings) console.log(`WARN  ${message}`)
for (const message of errors) console.error(`ERROR ${message}`)
if (!errors.length) console.log(`PASS  ${warnings.length} warning(s), no blocking errors.`)
process.exit(errors.length ? 1 : 0)
