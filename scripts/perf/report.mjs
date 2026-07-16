import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const outputPath = 'docs/perf-report.latest.json'
const budgetPath = 'docs/perf-budget.json'
const clientManifestPath = '.output/server/chunks/build/client.precomputed.mjs'
const moduleAnalysisPath = '.audit/client-entry-modules.json'

function run(command, args, environment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...environment },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''

    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (chunk) => {
        output += chunk.toString()
        process[stream === child.stdout ? 'stdout' : 'stderr'].write(chunk)
      })
    }

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`${command} ${args.join(' ')} failed with exit code ${String(code)}`))
    })
  })
}

function assertBudget(report, budget) {
  const initialJs = report.initialClient.assets
    .filter(asset => asset.file.endsWith('.js'))
    .reduce((total, asset) => total + asset.gzipKb, 0)
  const initialCss = report.initialClient.assets
    .filter(asset => asset.file.endsWith('.css'))
    .reduce((total, asset) => total + asset.gzipKb, 0)
  const adminEditor = report.topClientChunks.find(chunk => chunk.role === 'admin-deferred')
  const revealMotion = report.topClientChunks.find(chunk =>
    chunk.label === 'theme:app/components/RevealMotion',
  )
  const checks = [
    ['initial client', report.initialClient.gzipKb, budget.maxInitialGzipKb],
    ['initial JavaScript', initialJs, budget.maxInitialJavascriptGzipKb],
    ['initial CSS', initialCss, budget.maxInitialCssGzipKb],
    ['deferred editor', adminEditor?.gzipKb, budget.maxAdminDeferredGzipKb],
    ['reveal motion', revealMotion?.gzipKb, budget.maxRevealMotionGzipKb],
  ]
  const failures = checks
    .filter(([, actual, maximum]) =>
      typeof actual !== 'number' || actual > maximum,
    )
    .map(([label, actual, maximum]) => `${label}: ${String(actual)} kB > ${maximum} kB`)

  if (failures.length) {
    throw new Error(`Performance budget failed:\n- ${failures.join('\n- ')}`)
  }
}

function parseChunkLines(output) {
  const pattern = /dist\/client\/(_nuxt\/[^ ]+\.(?:js|css))\s+([0-9.,]+)\s+kB\s+│\s+gzip:\s+([0-9.,]+)\s+kB/g

  return [...output.matchAll(pattern)].map((match) => ({
    file: match[1],
    sizeKb: Number(match[2].replaceAll(',', '')),
    gzipKb: Number(match[3].replaceAll(',', '')),
  }))
}

function parseTotalSize(output) {
  const match = output.match(/Σ Total size:\s+([0-9.]+\s+\wB)\s+\(([0-9.]+\s+\wB gzip)\)/)

  return match ? { total: match[1], gzip: match[2] } : null
}

function normalizeModuleLabel(moduleId) {
  if (moduleId.endsWith('/nuxt/dist/app/entry.js')) return 'app-entry'

  const layerMatch = moduleId.match(/layers\/(auth|core|theme)\/(.+?)(?:\?[^?]*)?$/)
  if (layerMatch) return `${layerMatch[1]}:${layerMatch[2].replace(/\.(?:vue|ts)$/, '')}`

  const packageMatch = moduleId.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@?[^/]+(?:\/[^/]+)?)/)
  if (packageMatch) return `vendor:${packageMatch[1]}`

  return basename(moduleId).replace(/\.(?:vue|ts|js)$/, '')
}

function modulePriority(moduleId) {
  if (moduleId.endsWith('/nuxt/dist/app/entry.js')) return 100
  if (moduleId.includes('/layers/')) return 80
  if (moduleId.includes('/node_modules/')) return 20
  return 40
}

function parseChunkOwners(source) {
  const owners = new Map()
  const pattern = /(?:"([^"]+)"|([A-Za-z0-9_@./+~-]+)):\{file:"([^"]+\.(?:js|css))"/g

  for (const match of source.matchAll(pattern)) {
    const moduleId = match[1] || match[2]
    const file = `_nuxt/${match[3]}`
    const candidate = { moduleId, priority: modulePriority(moduleId) }
    const current = owners.get(file)

    if (!current || candidate.priority > current.priority) owners.set(file, candidate)
  }

  return owners
}

function classifyChunk(file, owner) {
  if (owner?.moduleId.endsWith('/nuxt/dist/app/entry.js')) return 'initial'
  if (file.endsWith('.css') && file.includes('/entry.')) return 'initial'
  if (owner?.moduleId.includes('/components/Edit/Text.vue')) return 'admin-deferred'
  return 'async'
}

async function main() {
  const output = await run('pnpm', ['build'], { STIR_PERF_ANALYZE: 'true' })
  const chunks = parseChunkLines(output)
  const manifest = await readFile(clientManifestPath, 'utf8').catch(() => '')
  const owners = parseChunkOwners(manifest)
  const labeledChunks = chunks
    .map((chunk) => {
      const owner = owners.get(chunk.file)

      return {
        label: owner ? normalizeModuleLabel(owner.moduleId) : 'shared-or-vendor',
        role: classifyChunk(chunk.file, owner),
        ...chunk,
      }
    })
    .sort((a, b) => b.gzipKb - a.gzipKb)
  const initialAssets = labeledChunks.filter(chunk => chunk.role === 'initial')
  const moduleAnalysis = JSON.parse(
    await readFile(moduleAnalysisPath, 'utf8').catch(() => '{"entries":[]}'),
  )
  const entryModules = moduleAnalysis.entries?.find(entry =>
    initialAssets.some(asset => asset.file.endsWith(entry.fileName)),
  )?.modules?.slice(0, 30) || []
  const report = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    initialClient: {
      sizeKb: Number(initialAssets.reduce((total, chunk) => total + chunk.sizeKb, 0).toFixed(2)),
      gzipKb: Number(initialAssets.reduce((total, chunk) => total + chunk.gzipKb, 0).toFixed(2)),
      assets: initialAssets,
      entryModules,
    },
    topClientChunks: labeledChunks.slice(0, 15),
    totalOutputSize: parseTotalSize(output),
  }

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  const budget = JSON.parse(await readFile(budgetPath, 'utf8'))

  assertBudget(report, budget)

  console.log('\n=== Stable client bundle report ===')
  console.log(`Initial static assets: ${report.initialClient.gzipKb.toFixed(2)} kB gzip`)
  for (const chunk of report.topClientChunks) {
    console.log(`${chunk.label} [${chunk.role}] | ${chunk.gzipKb.toFixed(2)} kB gzip | ${chunk.file}`)
  }
  console.log(`Saved: ${outputPath}`)
}

main().catch((error) => {
  console.error('[perf:report] failed:', error)
  process.exit(1)
})
