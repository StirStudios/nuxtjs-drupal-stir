const decode = value => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")

export function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
      .slice(1)
      .map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4] ?? '')]),
  )
}

export function crawlableUrl(value, base) {
  if (!value || /^(?:#|mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(value)) return null

  try {
    const url = new URL(value, base)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    return url
  } catch {
    return null
  }
}

export function hasNoindex(value) {
  return value.toLowerCase().split(/[\s,]+/).includes('noindex')
}

/**
 * Reads an explicit `--url <origin>` or `--url=<origin>` command-line argument.
 *
 * Audits never take their target from environment variables, whose local or
 * staging values would silently point them at the wrong site.
 */
export function readUrlArgument(argv = process.argv.slice(2)) {
  const index = argv.findIndex(arg => arg === '--url' || arg.startsWith('--url='))
  if (index < 0) return ''
  return argv[index] === '--url' ? argv[index + 1] ?? '' : argv[index].slice('--url='.length)
}

export function resolveSiteUrl(value, config = {}) {
  const candidate = value?.trim() || config.seo?.siteUrl?.trim() || config.owner?.domain?.trim()
  if (!candidate) return ''

  try {
    const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : ''
  } catch {
    return ''
  }
}
