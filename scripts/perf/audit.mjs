#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { readUrlArgument, resolveSiteUrl } from '../seo/html.mjs'

const args = process.argv.slice(2)
const compliance = await readFile(resolve(process.cwd(), 'compliance/site.json'), 'utf8')
  .then(value => JSON.parse(value))
  .catch(() => ({}))
const config = compliance.performance ?? {}
const siteUrl = resolveSiteUrl(readUrlArgument(args), compliance)
const apiKey = process.env.PAGESPEED_API_KEY?.trim()
const formFactors = (args.find(arg => arg.startsWith('--form-factor='))?.split('=')[1] ?? 'mobile,desktop')
  .split(',')
  .filter(value => value === 'mobile' || value === 'desktop')
// Simulated (lantern) throttling attributes long render delays to text LCPs
// that real throttling paints at FCP, so local runs throttle for real unless
// asked. PageSpeed Insights always simulates.
const throttling = apiKey ? 'simulate' : (args.find(arg => arg.startsWith('--throttling='))?.split('=')[1] ?? 'devtools')
const outputDirectory = args.find(arg => arg.startsWith('--output='))?.split('=')[1]
const routes = (process.env.PERF_ROUTES?.split(',') ?? config.auditRoutes ?? ['/'])
  .map(route => route.trim())
  .filter(route => route.startsWith('/'))

// Lighthouse's own "good" thresholds; a site overrides any value in
// performance.budgets.<formFactor>.<metric> = { warn, error }.
const defaultBudgets = {
  mobile: {
    score: { warn: 90, error: 50 },
    lcpMs: { warn: 2500, error: 4000 },
    fcpMs: { warn: 1800, error: 3000 },
    tbtMs: { warn: 200, error: 600 },
    cls: { warn: 0.1, error: 0.1 },
    totalBytes: { warn: 3_000_000, error: 6_000_000 },
  },
  desktop: {
    score: { warn: 90, error: 70 },
    lcpMs: { warn: 1200, error: 2500 },
    fcpMs: { warn: 900, error: 1800 },
    tbtMs: { warn: 150, error: 350 },
    cls: { warn: 0.1, error: 0.1 },
    totalBytes: { warn: 3_000_000, error: 6_000_000 },
  },
}
const higherIsBetter = new Set(['score'])
const errors = []
const warnings = []

const seconds = ms => `${(ms / 1000).toFixed(1)} s`
const megabytes = bytes => `${(bytes / 1_000_000).toFixed(2)} MB`
const format = {
  score: value => String(value),
  lcpMs: seconds,
  fcpMs: seconds,
  tbtMs: ms => `${Math.round(ms)} ms`,
  cls: value => value.toFixed(3),
  totalBytes: megabytes,
}

function budgetsFor(formFactor) {
  const overrides = config.budgets?.[formFactor] ?? {}

  return Object.fromEntries(Object.entries(defaultBudgets[formFactor])
    .map(([metric, budget]) => [metric, { ...budget, ...overrides[metric] }]))
}

function summarize(lhr) {
  const audit = id => lhr.audits[id]
  const lcpNode = audit('largest-contentful-paint-element')?.details?.items?.[0]?.items?.[0]?.node
    ?? audit('lcp-breakdown-insight')?.details?.items?.find(item => item.type === 'node')
  const performanceRefs = lhr.categories.performance?.auditRefs ?? []
  const opportunities = performanceRefs
    .map(ref => audit(ref.id))
    .filter(item => item && item.score !== null && item.score < 0.9 && item.metricSavings)
    .map(item => ({
      title: item.title,
      displayValue: item.displayValue ?? '',
      savings: (item.metricSavings.LCP ?? 0) + (item.metricSavings.FCP ?? 0) + (item.metricSavings.TBT ?? 0),
    }))
    .filter(item => item.savings > 0 || item.displayValue)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5)

  return {
    metrics: {
      score: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      lcpMs: audit('largest-contentful-paint')?.numericValue ?? 0,
      fcpMs: audit('first-contentful-paint')?.numericValue ?? 0,
      tbtMs: audit('total-blocking-time')?.numericValue ?? 0,
      cls: audit('cumulative-layout-shift')?.numericValue ?? 0,
      totalBytes: audit('total-byte-weight')?.numericValue ?? 0,
    },
    lcpElement: lcpNode ? `${lcpNode.selector ?? ''} ${lcpNode.snippet ?? ''}`.trim() : '',
    opportunities,
    lighthouseVersion: lhr.lighthouseVersion,
  }
}

async function runPageSpeed(url, formFactor) {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  endpoint.searchParams.set('url', url)
  endpoint.searchParams.set('strategy', formFactor)
  endpoint.searchParams.set('category', 'performance')
  endpoint.searchParams.set('key', apiKey)
  const response = await fetch(endpoint)
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.message ?? `PageSpeed Insights HTTP ${response.status}`)

  return body.lighthouseResult
}

async function localRunner() {
  const [{ default: lighthouse }, { launch }, { default: desktopConfig }] = await Promise.all([
    import('lighthouse'),
    import('chrome-launcher'),
    import('lighthouse/core/config/desktop-config.js'),
  ])
  let chromePath = process.env.CHROME_PATH
  if (!chromePath) {
    const { chromium } = await import('@playwright/test')
    chromePath = chromium.executablePath()
  }

  return async (url, formFactor) => {
    const chrome = await launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] })

    try {
      const result = await lighthouse(url, {
        logLevel: 'error',
        onlyCategories: ['performance'],
        output: 'json',
        port: chrome.port,
        throttlingMethod: throttling,
      }, formFactor === 'desktop' ? desktopConfig : undefined)
      if (!result) throw new Error('Lighthouse returned no result')
      return result.lhr
    }
    finally {
      await chrome.kill()
    }
  }
}

if (!siteUrl) {
  console.error('ERROR Set owner.domain in compliance/site.json or pass --url <origin>.')
  process.exit(1)
}
if (!routes.length) {
  console.error('ERROR performance.auditRoutes in compliance/site.json has no routes starting with "/".')
  process.exit(1)
}

let run
try {
  run = apiKey ? runPageSpeed : await localRunner()
}
catch (error) {
  console.error(`ERROR ${error.message}`)
  console.error('Install lighthouse, chrome-launcher and @playwright/test (pnpm test:a11y:install for Chromium), set CHROME_PATH, or set PAGESPEED_API_KEY.')
  process.exit(1)
}

if (!['devtools', 'simulate'].includes(throttling)) {
  console.error('ERROR --throttling must be devtools or simulate.')
  process.exit(1)
}

console.log(`TARGET ${siteUrl} (${apiKey ? 'PageSpeed Insights' : 'local Lighthouse'}, ${throttling} throttling, ${formFactors.join(' + ')})`)

for (const route of routes) {
  const url = new URL(route, siteUrl).href

  for (const formFactor of formFactors) {
    const label = `${route} ${formFactor}`
    let summary

    try {
      const lhr = await run(url, formFactor)
      summary = summarize(lhr)
      if (outputDirectory) {
        await mkdir(outputDirectory, { recursive: true })
        await writeFile(resolve(outputDirectory, `${route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'}-${formFactor}.json`), JSON.stringify(lhr))
      }
    }
    catch (error) {
      errors.push(`${label}: ${error.message}`)
      console.log(`\nERROR ${label}: ${error.message}`)
      continue
    }

    const { metrics } = summary
    console.log(`\n${label} (Lighthouse ${summary.lighthouseVersion})`)
    console.log(`  Score ${metrics.score}  LCP ${seconds(metrics.lcpMs)}  FCP ${seconds(metrics.fcpMs)}  TBT ${Math.round(metrics.tbtMs)} ms  CLS ${metrics.cls.toFixed(3)}  Weight ${megabytes(metrics.totalBytes)}`)
    if (summary.lcpElement) console.log(`  LCP element: ${summary.lcpElement.slice(0, 200)}`)
    for (const item of summary.opportunities) {
      console.log(`  - ${item.title}${item.displayValue ? ` (${item.displayValue})` : ''}`)
    }

    for (const [metric, budget] of Object.entries(budgetsFor(formFactor))) {
      const value = metrics[metric]
      const exceeds = limit => higherIsBetter.has(metric) ? value < limit : value > limit
      const message = `${label}: ${metric} ${format[metric](value)} ${higherIsBetter.has(metric) ? 'is below' : 'exceeds'} the`
      if (exceeds(budget.error)) errors.push(`${message} error budget ${format[metric](budget.error)}.`)
      else if (exceeds(budget.warn)) warnings.push(`${message} warning budget ${format[metric](budget.warn)}.`)
    }
  }
}

console.log('')
for (const message of warnings) console.log(`WARN  ${message}`)
for (const message of errors) console.log(`ERROR ${message}`)
if (!errors.length) console.log(`OK    Performance budgets met (${warnings.length} warning${warnings.length === 1 ? '' : 's'}).`)
process.exit(errors.length ? 1 : 0)
