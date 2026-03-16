import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['build'], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
      process.stdout.write(chunk)
    })
    child.stderr.on('data', (chunk) => {
      output += chunk.toString()
      process.stderr.write(chunk)
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`pnpm build failed with exit code ${String(code)}`))
        return
      }
      resolve(output)
    })
  })
}

function parseChunkLines(output) {
  const lines = output.split('\n')
  const chunkRegex =
    /dist\/client\/(_nuxt\/[^ ]+\.js)\s+([0-9.]+)\s+kB\s+│\s+gzip:\s+([0-9.]+)\s+kB/
  const chunks = []

  for (const line of lines) {
    const match = line.match(chunkRegex)
    if (!match) continue
    const [, name, size, gzip] = match
    chunks.push({
      name,
      sizeKb: Number(size),
      gzipKb: Number(gzip),
    })
  }

  chunks.sort((a, b) => b.sizeKb - a.sizeKb)
  return chunks
}

function parseTotalSize(output) {
  const totalMatch = output.match(/Σ Total size:\s+([0-9.]+\s+\wB)\s+\(([0-9.]+\s+\wB gzip)\)/)
  if (!totalMatch) return null
  return {
    total: totalMatch[1],
    gzip: totalMatch[2],
  }
}

async function main() {
  const output = await runBuild()
  const chunks = parseChunkLines(output)
  const total = parseTotalSize(output)

  const report = {
    generatedAt: new Date().toISOString(),
    topClientChunks: chunks.slice(0, 10),
    totalOutputSize: total,
  }

  await writeFile('docs/perf-report.latest.json', JSON.stringify(report, null, 2))

  console.log('\n=== Perf Report (Top 10 Client Chunks) ===')
  for (const chunk of report.topClientChunks) {
    console.log(
      `${chunk.name} | ${chunk.sizeKb.toFixed(2)} kB | gzip ${chunk.gzipKb.toFixed(2)} kB`,
    )
  }
  if (total) {
    console.log(`Total output size: ${total.total} (${total.gzip})`)
  }
  console.log('Saved: docs/perf-report.latest.json')
}

main().catch((error) => {
  console.error('[perf:report] failed:', error)
  process.exit(1)
})
