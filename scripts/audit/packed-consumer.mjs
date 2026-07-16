import { spawn } from 'node:child_process'
import { access, cp, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'

const rootDir = resolve('.')
const fixtureDir = resolve('tests/fixtures/consumer-app/app')
const consumerLayers = [
  { label: 'root', specifier: '@stir/base' },
  { label: 'minimal', specifier: '@stir/base/presets/minimal' },
  { label: 'full', specifier: '@stir/base/presets/full' },
]
const keepTemporary = process.argv.includes('--keep-temporary')
const maxArchiveBytes = 300_000
const maxArchiveEntries = 428

function run(command, args, cwd, environment = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...environment },
      stdio: ['inherit', 'pipe', 'pipe'],
    })
    let output = ''

    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (chunk) => {
        const text = chunk.toString()
        output += text
        process.stdout.write(text)
      })
    }

    child.on('error', reject)
    child.on('exit', (code) => {
      if (output.includes('Cannot extend config from')) {
        reject(new Error('Packed layer could not be resolved by the consumer'))
      } else if (code === 0) resolvePromise(output)
      else reject(new Error(`${command} ${args.join(' ')} failed with exit code ${String(code)}`))
    })
  })
}

async function pathExists(path) {
  return access(path).then(() => true, () => false)
}

async function main() {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'stir-packed-consumer-'))

  try {
    await run('pnpm', ['pack', '--pack-destination', temporaryRoot], rootDir)
    const archives = (await readdir(temporaryRoot)).filter(file => file.endsWith('.tgz'))
    if (archives.length !== 1) throw new Error('Expected one packed layer archive')

    const archivePath = join(temporaryRoot, archives[0])
    const archiveSize = (await stat(archivePath)).size
    const archiveEntries = String(
      await run('tar', ['-tzf', archivePath], rootDir),
    ).trim().split('\n')

    if (archiveSize > maxArchiveBytes) {
      throw new Error(
        `Packed layer is ${archiveSize} bytes; the published budget is ${maxArchiveBytes} bytes.`,
      )
    }

    if (archiveEntries.length > maxArchiveEntries) {
      throw new Error(
        `Packed layer contains ${archiveEntries.length} files; the published budget is ${maxArchiveEntries}.`,
      )
    }

    for (const excludedPath of [
      'package/.github/',
      'package/docs/',
      'package/tests/',
    ]) {
      if (archiveEntries.some(entry => entry.startsWith(excludedPath))) {
        throw new Error(`Packed layer includes repository-only path ${excludedPath}.`)
      }
    }

    const unexpectedScripts = archiveEntries.filter(entry =>
      entry.startsWith('package/scripts/')
      && !entry.startsWith('package/scripts/a11y/'),
    )
    if (unexpectedScripts.length > 0) {
      throw new Error(
        `Packed layer includes repository-only script ${unexpectedScripts[0]}.`,
      )
    }

    for (const requiredPath of [
      'package/contracts/stir-tools/v1/manifest.json',
      'package/layers/platform/nuxt.config.ts',
      'package/layers/theme/nuxt.config.ts',
      'package/presets/minimal/nuxt.config.ts',
      'package/presets/full/nuxt.config.ts',
      'package/scripts/a11y/run.mjs',
      'package/nuxt.config.ts',
    ]) {
      if (!archiveEntries.includes(requiredPath)) {
        throw new Error(`Packed layer is missing required path ${requiredPath}.`)
      }
    }

    const rootPackage = JSON.parse(await readFile(resolve('package.json'), 'utf8'))
    const consumerDir = join(temporaryRoot, 'consumer')
    await mkdir(consumerDir)
    await cp(fixtureDir, join(consumerDir, 'app'), { recursive: true })
    await writeFile(
      join(consumerDir, 'tsconfig.json'),
      `${JSON.stringify({ extends: './.nuxt/tsconfig.json' }, null, 2)}\n`,
    )
    await writeFile(
      join(consumerDir, 'package.json'),
      `${JSON.stringify({
        name: 'stir-packed-consumer',
        private: true,
        type: 'module',
        packageManager: rootPackage.packageManager,
        scripts: {
          build: 'nuxi build',
          typecheck: 'nuxi typecheck',
        },
        dependencies: {
          '@stir/base': `file:${archivePath}`,
          nuxt: rootPackage.peerDependencies.nuxt,
        },
        devDependencies: {
          typescript: rootPackage.devDependencies.typescript,
          'vue-tsc': rootPackage.devDependencies['vue-tsc'],
        },
      }, null, 2)}\n`,
    )

    await run('pnpm', ['install', '--no-frozen-lockfile'], consumerDir)
    const installedConsumerPackage = JSON.parse(
      await readFile(join(consumerDir, 'package.json'), 'utf8'),
    )
    if (installedConsumerPackage.dependencies?.nuxt !== rootPackage.peerDependencies.nuxt) {
      throw new Error('Packed consumer must own the layer Nuxt peer directly.')
    }
    if (!await pathExists(join(consumerDir, 'node_modules/.bin/stir-a11y'))) {
      throw new Error('Packed layer did not expose the stir-a11y executable.')
    }
    for (const layer of consumerLayers) {
      // Each entry point is an independent consumer contract. Do not let Nuxt's
      // generated component, import, or app-config types leak across them.
      await rm(join(consumerDir, '.nuxt'), { recursive: true, force: true })
      await rm(join(consumerDir, '.output'), { recursive: true, force: true })
      await writeFile(
        join(consumerDir, 'nuxt.config.ts'),
        `export default defineNuxtConfig({ extends: ['${layer.specifier}'] })\n`,
      )
      await run('pnpm', ['typecheck'], consumerDir)
      await run('pnpm', ['build'], consumerDir, { STIR_PERF_ANALYZE: 'true' })
      const installedReport = join(
        consumerDir,
        'node_modules/@stir/base/.audit/client-entry-modules.json',
      )
      if (await pathExists(installedReport)) {
        throw new Error(
          `Packed ${layer.label} consumer registered the repository diagnostics writer.`,
        )
      }
      console.log(`Packed ${layer.label} consumer validation passed.`)
    }
  } finally {
    if (keepTemporary) console.log(`Temporary consumer retained at ${temporaryRoot}`)
    else await rm(temporaryRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
