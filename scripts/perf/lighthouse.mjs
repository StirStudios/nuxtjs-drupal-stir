import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const prefix = `--${name}=`
  const value = args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)

  return value || fallback
}
const numberOption = (name, fallback) => Number(option(name, String(fallback)))
const url = option('url', process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:3000/')
const runs = Math.max(1, numberOption('runs', 3))
const shouldAssert = args.includes('--assert')
const outputDirectory = '.lighthouse'
const combinedMediaBudget = option('max-media-bytes', '')

const budgets = {
  imageBytes: numberOption('max-image-bytes', 1_000_000),
  lcpMs: numberOption('max-lcp', 4000),
  mediaBytes: combinedMediaBudget ? Number(combinedMediaBudget) : null,
  minScore: numberOption('min-score', 80),
  tbtMs: numberOption('max-tbt', 300),
  totalBytes: numberOption('max-total-bytes', 2_000_000),
  videoBytes: numberOption('max-video-bytes', 0),
}

function auditNumber(lhr, id) {
  return Number(lhr.audits[id]?.numericValue || 0)
}

function auditDetailNumber(lhr, id, key) {
  return Number(lhr.audits[id]?.details?.[key] || 0)
}

function requestBytes(requests, resourceType) {
  return requests
    .filter((request) => request.resourceType === resourceType)
    .reduce((total, request) => total + Number(request.transferSize || 0), 0)
}

function summarize(lhr) {
  const requests = lhr.audits['network-requests']?.details?.items || []
  const imageBytes = requestBytes(requests, 'Image')
  const videoBytes = requestBytes(requests, 'Media')

  return {
    score: Math.round(Number(lhr.categories.performance?.score || 0) * 100),
    fcpMs: auditNumber(lhr, 'first-contentful-paint'),
    lcpMs: auditNumber(lhr, 'largest-contentful-paint'),
    tbtMs: auditNumber(lhr, 'total-blocking-time'),
    cls: auditNumber(lhr, 'cumulative-layout-shift'),
    totalBytes: auditNumber(lhr, 'total-byte-weight'),
    requestCount: requests.length,
    cssBytes: requestBytes(requests, 'Stylesheet'),
    jsBytes: requestBytes(requests, 'Script'),
    imageBytes,
    videoBytes,
    mediaBytes: imageBytes + videoBytes,
    unusedCssBytes: auditDetailNumber(lhr, 'unused-css-rules', 'overallSavingsBytes'),
    unusedJsBytes: auditDetailNumber(lhr, 'unused-javascript', 'overallSavingsBytes'),
    renderBlockingFcpMs: Number(
      lhr.audits['render-blocking-insight']?.metricSavings?.FCP || 0,
    ),
    renderBlockingLcpMs: Number(
      lhr.audits['render-blocking-insight']?.metricSavings?.LCP || 0,
    ),
    mainThreadMs: auditNumber(lhr, 'mainthread-work-breakdown'),
    scriptExecutionMs: auditNumber(lhr, 'bootup-time'),
    videoRequestCount: requests.filter((request) =>
      /\.(?:m3u8|mp4)(?:\?|$)/i.test(request.url),
    ).length,
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function medianSummary(results) {
  return Object.fromEntries(
    Object.keys(results[0]).map((key) => [
      key,
      median(results.map((result) => result[key])),
    ]),
  )
}

function formatBytes(bytes) {
  return `${(bytes / 1_000_000).toFixed(2)} MB`
}

async function main() {
  await mkdir(outputDirectory, { recursive: true })
  const results = []

  for (let index = 1; index <= runs; index += 1) {
    const chrome = await launch({
      chromePath: process.env.LIGHTHOUSE_CHROME_PATH,
      chromeFlags: ['--headless', '--ignore-certificate-errors', '--no-sandbox'],
    })

    try {
      const runner = await lighthouse(url, {
        formFactor: 'mobile',
        logLevel: 'error',
        onlyCategories: ['performance'],
        output: 'json',
        port: chrome.port,
      })

      if (!runner) throw new Error(`Lighthouse run ${index} returned no result`)

      const summary = summarize(runner.lhr)
      results.push(summary)
      await writeFile(
        `${outputDirectory}/run-${index}.json`,
        JSON.stringify(runner.lhr),
      )
      console.log(
        `Run ${index}: score ${summary.score}, LCP ${(summary.lcpMs / 1000).toFixed(2)}s, ` +
        `${formatBytes(summary.totalBytes)}, media ${formatBytes(summary.mediaBytes)}`,
      )
    } finally {
      await chrome.kill()
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    url,
    runs: results,
    median: medianSummary(results),
    budgets,
  }

  await writeFile(
    `${outputDirectory}/summary.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  )

  const { median: result } = report
  console.log('\nMedian')
  console.log(`Score: ${result.score}`)
  console.log(`FCP: ${(result.fcpMs / 1000).toFixed(2)}s`)
  console.log(`LCP: ${(result.lcpMs / 1000).toFixed(2)}s`)
  console.log(`TBT: ${result.tbtMs.toFixed(0)}ms`)
  console.log(`Transfer: ${formatBytes(result.totalBytes)}`)
  console.log(
    `CSS: ${formatBytes(result.cssBytes)} ` +
    `(unused ${formatBytes(result.unusedCssBytes)}, render-blocking savings ${result.renderBlockingFcpMs.toFixed(0)}ms FCP)`,
  )
  console.log(
    `JS: ${formatBytes(result.jsBytes)} ` +
    `(unused ${formatBytes(result.unusedJsBytes)}, execution ${result.scriptExecutionMs.toFixed(0)}ms)`,
  )
  console.log(`Main thread: ${result.mainThreadMs.toFixed(0)}ms`)
  console.log(
    `Media: ${formatBytes(result.mediaBytes)} ` +
    `(images ${formatBytes(result.imageBytes)}, video ${formatBytes(result.videoBytes)}, ` +
    `${result.videoRequestCount} video requests)`,
  )
  console.log(`Saved: ${outputDirectory}/summary.json`)

  if (!shouldAssert) return

  const failures = [
    result.score < budgets.minScore && `score ${result.score} < ${budgets.minScore}`,
    result.lcpMs > budgets.lcpMs && `LCP ${result.lcpMs.toFixed(0)}ms > ${budgets.lcpMs}ms`,
    result.tbtMs > budgets.tbtMs && `TBT ${result.tbtMs.toFixed(0)}ms > ${budgets.tbtMs}ms`,
    result.totalBytes > budgets.totalBytes &&
      `transfer ${result.totalBytes}B > ${budgets.totalBytes}B`,
    result.imageBytes > budgets.imageBytes &&
      `images ${result.imageBytes}B > ${budgets.imageBytes}B`,
    result.videoBytes > budgets.videoBytes &&
      `video ${result.videoBytes}B > ${budgets.videoBytes}B`,
    budgets.mediaBytes !== null && result.mediaBytes > budgets.mediaBytes &&
      `media ${result.mediaBytes}B > ${budgets.mediaBytes}B`,
  ].filter(Boolean)

  if (failures.length) {
    throw new Error(`Lighthouse budgets failed:\n- ${failures.join('\n- ')}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
