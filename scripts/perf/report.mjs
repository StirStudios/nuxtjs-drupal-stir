import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const outputPath = 'docs/perf-report.latest.json'
const clientManifestPath = '.output/server/chunks/build/client.precomputed.mjs'

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
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
  const output = await run('pnpm', ['build'])
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
  const report = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    initialClient: {
      sizeKb: Number(initialAssets.reduce((total, chunk) => total + chunk.sizeKb, 0).toFixed(2)),
      gzipKb: Number(initialAssets.reduce((total, chunk) => total + chunk.gzipKb, 0).toFixed(2)),
      assets: initialAssets,
    },
    topClientChunks: labeledChunks.slice(0, 15),
    totalOutputSize: parseTotalSize(output),
  }

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)

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
