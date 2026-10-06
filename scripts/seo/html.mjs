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

/**
 * Whether robots.txt lets a crawler fetch a path, the way Google reads it.
 *
 * Uses the most specific matching user-agent group, falling back to `*`, and
 * the longest matching `Allow` or `Disallow` rule, with `Allow` winning a tie.
 * `*` and a trailing `$` work as in Google's matcher. An empty file allows all.
 */
export function robotsAllows(robotsTxt, path, agent = 'googlebot') {
  const groups = []
  let current = null
  let readingAgents = false

  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!match) continue
    const field = match[1].toLowerCase()
    const value = match[2].trim()

    if (field === 'user-agent') {
      if (!readingAgents) {
        current = { agents: [], rules: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      readingAgents = true
      continue
    }
    readingAgents = false
    if (current && (field === 'allow' || field === 'disallow')) {
      current.rules.push({ allow: field === 'allow', pattern: value })
    }
  }

  const name = agent.toLowerCase()
  const group = groups.find(item => item.agents.some(value => value !== '*' && name.startsWith(value)))
    ?? groups.find(item => item.agents.includes('*'))
  if (!group) return true

  let best = null
  for (const rule of group.rules) {
    if (!rule.pattern) continue
    const anchored = rule.pattern.endsWith('$')
    const body = (anchored ? rule.pattern.slice(0, -1) : rule.pattern)
      .split('*')
      .map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')
    if (!new RegExp(`^${body}${anchored ? '$' : ''}`).test(path)) continue
    if (!best || rule.pattern.length > best.pattern.length
      || (rule.pattern.length === best.pattern.length && rule.allow)) best = rule
  }

  return best ? best.allow : true
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
