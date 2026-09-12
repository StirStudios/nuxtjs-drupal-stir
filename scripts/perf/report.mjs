import { spawn } from 'node:child_process'
import { appendFile, readFile, readdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { basename, resolve } from 'node:path'
import { describeGrowth } from './growth.mjs'

const arguments_ = process.argv.slice(2)
const readArgument = name => arguments_
  .find(argument => argument.startsWith(`--${name}=`))
  ?.slice(name.length + 3)
const buildCwd = readArgument('cwd') || '.'
const outputPath = readArgument('output') || 'docs/perf-report.latest.json'
const skipBudget = arguments_.includes('--no-budget')
const reuseBuild = arguments_.includes('--no-build')
const warnBudget = arguments_.includes('--warn-budget')
const budgetPath = 'docs/perf-budget.json'
const clientManifestPaths = [
  '.output/server/chunks/build/client.precomputed.mjs',
  '.output/server/chunks/virtual/precomputed.mjs',
].map(path => resolve(buildCwd, path))
const moduleAnalysisPath = resolve(buildCwd, '.audit/client-entry-modules.json')

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

function assertBudget(report, budget, previous) {
  const initialJs = report.initialClient.assets
    .filter(asset => asset.file.endsWith('.js'))
    .reduce((total, asset) => total + asset.gzipKb, 0)
  const initialCss = report.initialClient.assets
    .filter(asset => asset.file.endsWith('.css'))
    .reduce((total, asset) => total + asset.gzipKb, 0)
  const adminEditor = report.editorExclusive.assets[0]
  const revealMotion = report.revealMotion
  const checks = [
    ['initial client', report.initialClient.gzipKb, budget.maxInitialGzipKb],
    ['initial JavaScript', initialJs, budget.maxInitialJavascriptGzipKb],
    ['initial CSS', initialCss, budget.maxInitialCssGzipKb],
    ['largest deferred editor chunk (not total)', adminEditor?.gzipKb, budget.maxAdminDeferredGzipKb],
    ['reveal motion', revealMotion?.gzipKb, budget.maxRevealMotionGzipKb],
  ]
  const failures = checks
    .filter(([, actual, maximum]) =>
      typeof actual !== 'number' || actual > maximum,
    )
    .map(([label, actual, maximum]) => `${label}: ${String(actual)} kB > ${maximum} kB`)

  if (failures.length) {
    const message = `Performance budget exceeded:\n- ${failures.join('\n- ')}`
      + describeGrowth(report, previous)
      + '\n\nEither recover the bytes (see docs/perf-initial-graph.md) or, if the'
      + '\nincrease is intended, re-baseline deliberately: update the caps in'
      + '\ndocs/perf-budget.json with a rationale, move the matching ratchet in'
      + '\ntests/utils/layerContract.spec.ts, and say why in the commit.'
    if (warnBudget) console.warn(message)
    else throw new Error(message)
  }
}

async function readClientAssets() {
  const root = resolve(buildCwd, '.output/public')
  const files = await readdir(resolve(root, '_nuxt'), { recursive: true })
  return Promise.all(files.filter(file => /\.(?:js|css)$/.test(file)).map(async (file) => {
    const data = await readFile(resolve(root, '_nuxt', file))
    return { file: `_nuxt/${file}`, sizeKb: data.byteLength / 1000, gzipKb: gzipSync(data).byteLength / 1000 }
  }))
}

function parseTotalSize(output) {
  const match = output.match(/Σ Total size:\s+([0-9.]+\s+\wB)\s+\(([0-9.]+\s+\wB gzip)\)/)

  return match ? { total: match[1], gzip: match[2] } : null
}

function parseEnvironment(output) {
  const match = output.match(
    /Nuxt\s+([^ ]+)\s+\(with Nitro\s+([^,]+),\s+Vite\s+([^ ]+)\s+and Vue\s+([^)]+)\)/,
  )

  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    ...(match && {
      nuxt: match[1],
      nitro: match[2],
      vite: match[3],
      vue: match[4],
    }),
  }
}

function parseBuildTimings(output) {
  const client = output.match(/(?:Vite )?Client built in ([0-9]+)ms/)
  const server = output.match(/(?:Vite )?Server built in ([0-9]+)ms/)
  const nitro = output.match(/Nuxt Nitro server built in ([0-9]+)ms/)

  return {
    ...(client && { clientMs: Number(client[1]) }),
    ...(server && { serverMs: Number(server[1]) }),
    ...(nitro && { nitroMs: Number(nitro[1]) }),
  }
}

function normalizeModuleLabel(moduleId) {
  if (moduleId.endsWith('/nuxt/dist/app/entry.js')) return 'app-entry'

  const layerMatch = moduleId.match(/layers\/([^/]+)\/(.+?)(?:\?[^?]*)?$/)
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

function mergeAnalyzedOwners(owners, chunks) {
  for (const chunk of chunks) {
    const candidates = [
      ...(chunk.facadeModuleId ? [chunk.facadeModuleId] : []),
      ...chunk.modules.map(module => module.id),
    ]
    const moduleId = candidates.sort(
      (left, right) => modulePriority(right) - modulePriority(left),
    )[0]
    if (!moduleId) continue

    const candidate = { moduleId, priority: modulePriority(moduleId) }
    const current = owners.get(chunk.fileName)
    if (!current || candidate.priority > current.priority) {
      owners.set(chunk.fileName, candidate)
    }
  }

  return owners
}

function collectStaticClosure(chunks, roots) {
  const byFile = new Map(chunks.map(chunk => [chunk.fileName, chunk]))
  const collected = new Set()
  const queue = [...roots]

  while (queue.length) {
    const file = queue.shift()
    if (!file || collected.has(file)) continue
    collected.add(file)
    queue.push(...(byFile.get(file)?.imports || []))
  }

  return collected
}

function classifyChunk(file, owner, initialFiles, adminFiles) {
  if (initialFiles.has(file)) return 'initial'
  if (file.endsWith('.css') && file.includes('/entry.')) return 'initial'
  if (adminFiles.has(file)) return 'admin-deferred'
  return 'async'
}

async function main() {
  const buildArguments = buildCwd === '.'
    ? ['build']
    : ['exec', 'nuxi', 'build', '--cwd', buildCwd]
  const output = reuseBuild ? '' : await run('pnpm', buildArguments, { STIR_PERF_ANALYZE: 'true' })
  const chunks = await readClientAssets()
  let manifest = ''
  for (const manifestPath of clientManifestPaths) {
    manifest = await readFile(manifestPath, 'utf8').catch(() => '')
    if (manifest) break
  }
  const moduleAnalysis = JSON.parse(
    await readFile(moduleAnalysisPath, 'utf8'),
  )
  const analyzedChunks = moduleAnalysis.chunks || []
  const outputFiles = new Set(chunks.map(chunk => chunk.file))

  // Vite removes empty JavaScript facades for CSS-only entries after analysis.
  if (analyzedChunks.some(chunk => !outputFiles.has(chunk.fileName)
    && !chunk.facadeModuleId?.endsWith('.css'))) {
    throw new Error('Module analysis does not match the production assets. Rebuild the target with STIR_PERF_ANALYZE=true.')
  }
  const owners = mergeAnalyzedOwners(parseChunkOwners(manifest), analyzedChunks)
  const appEntries = analyzedChunks
    .filter(chunk => chunk.isEntry && chunk.modules.some(module =>
      module.id.endsWith('/nuxt/dist/app/entry.js'),
    ))
    .map(chunk => chunk.fileName)
  const editorEntries = analyzedChunks
    .filter(chunk => chunk.facadeModuleId?.includes('/components/Edit/Text.vue'))
    .map(chunk => chunk.fileName)
  if (!appEntries.length) throw new Error('Missing analyzed app entry. Build with STIR_PERF_ANALYZE=true before using --no-build.')
  const initialFiles = collectStaticClosure(analyzedChunks, appEntries)
  const adminFiles = collectStaticClosure(analyzedChunks, editorEntries)
  const leakedEditorModules = analyzedChunks.filter(chunk => initialFiles.has(chunk.fileName))
    .flatMap(chunk => chunk.modules).filter(module => /\/(?:@tiptap|prosemirror-[^/]+)\//.test(module.id))
  if (leakedEditorModules.length) throw new Error('Editor dependencies entered the anonymous initial static graph.')
  const labeledChunks = chunks
    .map((chunk) => {
      const owner = owners.get(chunk.file)

      return {
        label: owner ? normalizeModuleLabel(owner.moduleId) : 'shared-or-vendor',
        role: classifyChunk(chunk.file, owner, initialFiles, adminFiles),
        ...chunk,
      }
    })
    .sort((a, b) => b.gzipKb - a.gzipKb)
  const initialAssets = labeledChunks.filter(chunk => chunk.role === 'initial')
  const entryModules = analyzedChunks.filter(chunk => initialFiles.has(chunk.fileName))
    .flatMap(chunk => chunk.modules).sort((a, b) => b.renderedBytes - a.renderedBytes).slice(0, 30)
  const report = {
    schemaVersion: 4,
    measurement: 'Built asset gzip sizes; initial static dependency graph is not a browser route-transfer measurement.',
    invariants: { editorExcludedFromInitialGraph: true },
    editorExclusive: {
      gzipKb: labeledChunks.filter(chunk => chunk.role === 'admin-deferred').reduce((total, chunk) => total + chunk.gzipKb, 0),
      assets: labeledChunks.filter(chunk => chunk.role === 'admin-deferred'),
    },
    generatedAt: new Date().toISOString(),
    environment: parseEnvironment(output),
    buildTimings: parseBuildTimings(output),
    initialClient: {
      sizeKb: Number(initialAssets.reduce((total, chunk) => total + chunk.sizeKb, 0).toFixed(2)),
      gzipKb: Number(initialAssets.reduce((total, chunk) => total + chunk.gzipKb, 0).toFixed(2)),
      assets: initialAssets,
      entryModules: entryModules.map(module => ({ ...module, id: normalizeModuleLabel(module.id) })),
    },
    revealMotion: labeledChunks.find(chunk => chunk.label === 'theme:app/components/RevealMotion'),
    topClientChunks: labeledChunks.slice(0, 15),
    totalOutputSize: parseTotalSize(output),
  }

  // Read the committed baseline before overwriting it, so a failure can
  // attribute the growth rather than only report the total.
  const previousReport = await readFile(outputPath, 'utf8')
    .then(contents => JSON.parse(contents))
    .catch(() => undefined)

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  if (!skipBudget) {
    const budget = JSON.parse(await readFile(budgetPath, 'utf8'))
    assertBudget(report, budget, previousReport)
  }

  console.log('\n=== Stable client bundle report ===')
  console.log(`Initial static assets: ${report.initialClient.gzipKb.toFixed(2)} kB gzip`)
  for (const chunk of report.topClientChunks) {
    console.log(`${chunk.label} [${chunk.role}] | ${chunk.gzipKb.toFixed(2)} kB gzip | ${chunk.file}`)
  }
  console.log(`Saved: ${outputPath}`)
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, [
      '## Client bundle',
      '',
      `Initial static graph: **${report.initialClient.gzipKb.toFixed(2)} kB gzip**.`,
      `Exclusive editor graph: **${report.editorExclusive.gzipKb.toFixed(2)} kB gzip** (deferred).`,
      '',
      'Editor dependencies are absent from the anonymous initial static graph. Historical numeric budget overruns remain visible in the log; route transfer and timing are measured separately with Lighthouse.',
      '',
    ].join('\n'))
  }
}

main().catch((error) => {
  console.error('[perf:report] failed:', error)
  process.exit(1)
})
