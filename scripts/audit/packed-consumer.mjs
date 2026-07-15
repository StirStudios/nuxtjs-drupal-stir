import { spawn } from 'node:child_process'
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'

const rootDir = resolve('.')
const fixtureDir = resolve('tests/fixtures/consumer-app/app')
const presets = ['minimal', 'full']
const keepTemporary = process.argv.includes('--keep-temporary')

function run(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['inherit', 'pipe', 'pipe'] })
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
      } else if (code === 0) resolvePromise()
      else reject(new Error(`${command} ${args.join(' ')} failed with exit code ${String(code)}`))
    })
  })
}

async function main() {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'stir-packed-consumer-'))

  try {
    await run('pnpm', ['pack', '--pack-destination', temporaryRoot], rootDir)
    const archives = (await readdir(temporaryRoot)).filter(file => file.endsWith('.tgz'))
    if (archives.length !== 1) throw new Error('Expected one packed layer archive')

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
          '@stir/base': `file:${join(temporaryRoot, archives[0])}`,
          nuxt: rootPackage.dependencies.nuxt,
        },
        devDependencies: {
          typescript: rootPackage.devDependencies.typescript,
          'vue-tsc': rootPackage.devDependencies['vue-tsc'],
        },
      }, null, 2)}\n`,
    )

    await run('pnpm', ['install', '--no-frozen-lockfile'], consumerDir)
    for (const preset of presets) {
      await writeFile(
        join(consumerDir, 'nuxt.config.ts'),
        `export default defineNuxtConfig({ extends: ['@stir/base/presets/${preset}'] })\n`,
      )
      await run('pnpm', ['typecheck'], consumerDir)
      await run('pnpm', ['build'], consumerDir)
      console.log(`Packed ${preset} consumer validation passed.`)
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
