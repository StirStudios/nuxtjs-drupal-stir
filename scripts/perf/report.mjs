import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const arguments_ = process.argv.slice(2)
const readArgument = name => arguments_
  .find(argument => argument.startsWith(`--${name}=`))
  ?.slice(name.length + 3)
const buildCwd = readArgument('cwd') || '.'
const outputPath = readArgument('output') || 'docs/perf-report.latest.json'
const skipBudget = arguments_.includes('--no-budget')
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
  const output = await run('pnpm', buildArguments, { STIR_PERF_ANALYZE: 'true' })
  const chunks = parseChunkLines(output)
  let manifest = ''
  for (const manifestPath of clientManifestPaths) {
    manifest = await readFile(manifestPath, 'utf8').catch(() => '')
    if (manifest) break
  }
  const moduleAnalysis = JSON.parse(
    await readFile(moduleAnalysisPath, 'utf8').catch(() => '{"chunks":[]}'),
  )
  const analyzedChunks = moduleAnalysis.chunks || []
  const owners = mergeAnalyzedOwners(parseChunkOwners(manifest), analyzedChunks)
  const appEntries = analyzedChunks
    .filter(chunk => chunk.isEntry && chunk.modules.some(module =>
      module.id.endsWith('/nuxt/dist/app/entry.js'),
    ))
    .map(chunk => chunk.fileName)
  const editorEntries = analyzedChunks
    .filter(chunk => chunk.facadeModuleId?.includes('/components/Edit/Text.vue'))
    .map(chunk => chunk.fileName)
  const initialFiles = collectStaticClosure(analyzedChunks, appEntries)
  const adminFiles = collectStaticClosure(analyzedChunks, editorEntries)
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
  const entryModules = analyzedChunks.find(entry =>
    initialAssets.some(asset => asset.file.endsWith(entry.fileName)),
  )?.modules?.slice(0, 30) || []
  const report = {
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    environment: parseEnvironment(output),
    buildTimings: parseBuildTimings(output),
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
  if (!skipBudget) {
    const budget = JSON.parse(await readFile(budgetPath, 'utf8'))
    assertBudget(report, budget)
  }

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
