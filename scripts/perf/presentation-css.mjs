import { spawn } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const fixture = 'tests/fixtures/minimal-consumer'
const outputDirectory = resolve(fixture, '.output/public/_nuxt')
const reportPath = 'docs/presentation-css-report.latest.json'
const manifestPath = resolve(
  'contracts/stir-tools/v1/fixtures/presentation-usage-manifest.json',
)

function runBuild(environment) {
  return new Promise((resolveBuild, reject) => {
    const child = spawn('pnpm', ['exec', 'nuxi', 'build', '--cwd', fixture], {
      env: { ...process.env, ...environment },
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolveBuild()
      else reject(new Error(`Presentation CSS build failed with exit code ${String(code)}`))
    })
  })
}

async function measure(environment) {
  await rm(resolve(fixture, '.output'), { recursive: true, force: true })
  await runBuild(environment)

  const files = (await readdir(outputDirectory))
    .filter(file => file.endsWith('.css'))
    .sort()
  const assets = []

  for (const file of files) {
    const contents = await readFile(resolve(outputDirectory, file))

    assets.push({
      file,
      bytes: contents.byteLength,
      gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
    })
  }

  return {
    bytes: assets.reduce((total, asset) => total + asset.bytes, 0),
    gzipBytes: assets.reduce((total, asset) => total + asset.gzipBytes, 0),
    assets,
  }
}

const presentation = await measure({
  STIR_PRESENTATION_MANIFEST: manifestPath,
})

const report = {
  schemaVersion: 1,
  fixture,
  manifest: 'contracts/stir-tools/v1/fixtures/presentation-usage-manifest.json',
  presentation,
}

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
process.stdout.write(
  `Presentation CSS: ${String(presentation.bytes)} bytes (${String(presentation.gzipBytes)} gzip).\n`,
)
process.stdout.write(`Saved: ${reportPath}\n`)
