import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const baselinePath = resolve('docs/coverage-baseline.json')
const summaryPath = resolve('coverage/coverage-summary.json')

function runCoverage() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [
        resolve('node_modules/vitest/vitest.mjs'),
        'run',
        '--coverage',
        '--coverage.reporter=json-summary',
        '--coverage.reporter=text-summary',
      ],
      { env: process.env, stdio: 'inherit' },
    )

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`Coverage run failed with exit code ${String(code)}`))
    })
  })
}

function normalizePath(path) {
  return path.replaceAll('\\', '/')
}

async function main() {
  await runCoverage()

  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
  const summary = JSON.parse(await readFile(summaryPath, 'utf8'))
  const tolerance = Number(baseline.tolerancePercentagePoints || 0)
  const failures = []

  for (const [metric, expected] of Object.entries(baseline.totals)) {
    const actual = Number(summary.total?.[metric]?.pct)

    if (!Number.isFinite(actual) || actual + tolerance < Number(expected)) {
      failures.push(`${metric}: ${actual}% < ${expected}% baseline (${tolerance} point tolerance)`)
    }
  }

  const entries = Object.entries(summary).map(([path, metrics]) => [normalizePath(path), metrics])
  for (const [modulePath, thresholds] of Object.entries(baseline.criticalModules || {})) {
    const match = entries.find(([path]) => path.endsWith(normalizePath(modulePath)))

    if (!match) {
      failures.push(`${modulePath}: missing from coverage report`)
      continue
    }

    for (const [metric, expected] of Object.entries(thresholds)) {
      const actual = Number(match[1]?.[metric]?.pct)
      if (!Number.isFinite(actual) || actual < Number(expected)) {
        failures.push(`${modulePath} ${metric}: ${actual}% < ${expected}%`)
      }
    }
  }

  if (failures.length) throw new Error(`Coverage ratchet failed:\n- ${failures.join('\n- ')}`)
  console.log('Coverage ratchet passed.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
