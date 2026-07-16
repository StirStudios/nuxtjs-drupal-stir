import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const targetConfig = JSON.parse(await readFile(
  new URL('./consumer-targets.json', import.meta.url),
  'utf8',
))
const requestedNames = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
const shouldVerify = process.argv.includes('--verify')
const keepTemporary = process.argv.includes('--keep-temporary')

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      stdio: options.quiet ? 'pipe' : 'inherit',
    })
    let output = ''

    if (options.quiet) {
      child.stdout.on('data', chunk => { output += chunk.toString() })
      child.stderr.on('data', chunk => { output += chunk.toString() })
    }
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise(output)
      else reject(new Error(`${command} ${args.join(' ')} failed with exit code ${String(code)}${output ? `\n${output}` : ''}`))
    })
  })
}

async function consumerStatus(name, target) {
  const sourcePath = process.env[target.pathEnvironment]

  if (!sourcePath) {
    return { name, status: 'not-configured', pathEnvironment: target.pathEnvironment, routes: target.routes }
  }

  const path = resolve(sourcePath)
  const packageJson = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'))
  const revision = (await run('git', ['-C', path, 'rev-parse', 'HEAD'], { quiet: true })).trim()

  return {
    name,
    status: 'available',
    path,
    revision,
    packageName: packageJson.name,
    baseDependency: packageJson.dependencies?.['@stir/base'] || null,
    routes: target.routes,
  }
}

async function packLayer(directory) {
  await run('pnpm', ['pack', '--pack-destination', directory], { cwd: rootDir })
  const packageJson = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'))

  return join(directory, `${packageJson.name.replace(/^@/, '').replace('/', '-')}-${packageJson.version}.tgz`)
}

async function prepareConsumer(sourcePath, destination, archivePath, packagePath) {
  await run('git', ['-C', sourcePath, 'archive', '--format=tar', '-o', archivePath, 'HEAD'])
  await mkdir(destination, { recursive: true })
  await run('tar', ['-xf', archivePath, '-C', destination])

  const packageFile = join(destination, 'package.json')
  const packageJson = JSON.parse(await readFile(packageFile, 'utf8'))
  packageJson.dependencies ||= {}
  packageJson.dependencies['@stir/base'] = `file:${packagePath}`
  await writeFile(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`)

  const nuxtConfigPath = join(destination, 'nuxt.config.ts')
  const nuxtConfig = await readFile(nuxtConfigPath, 'utf8')
  await writeFile(
    nuxtConfigPath,
    nuxtConfig.replace(/github:StirStudios\/nuxtjs-drupal-stir(?:#dev)?/g, '@stir/base'),
  )
}

async function verifyConsumer(consumer, temporaryRoot, packagePath) {
  const destination = join(temporaryRoot, consumer.name)
  const archivePath = join(temporaryRoot, `${consumer.name}.tar`)
  await prepareConsumer(consumer.path, destination, archivePath, packagePath)
  await run('pnpm', ['install', '--no-frozen-lockfile'], { cwd: destination })
  await run('pnpm', ['typecheck'], { cwd: destination })
  await run('pnpm', ['build'], { cwd: destination })

  return { ...consumer, status: 'passed', temporaryPath: keepTemporary ? destination : undefined }
}

async function main() {
  const names = requestedNames.length ? requestedNames : Object.keys(targetConfig.targets)
  const unknown = names.filter(name => !targetConfig.targets[name])
  if (unknown.length) throw new Error(`Unknown consumers: ${unknown.join(', ')}`)

  const consumers = await Promise.all(names.map(name => consumerStatus(name, targetConfig.targets[name])))
  const available = consumers.filter(consumer => consumer.status === 'available')
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: shouldVerify ? 'verify' : 'inventory',
    consumers,
  }

  if (shouldVerify) {
    if (!available.length) throw new Error('No consumer paths are configured')
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'stir-consumers-'))

    try {
      const packagePath = await packLayer(temporaryRoot)
      report.consumers = []
      for (const consumer of consumers) {
        report.consumers.push(
          consumer.status === 'available'
            ? await verifyConsumer(consumer, temporaryRoot, packagePath)
            : consumer,
        )
      }
    } finally {
      if (!keepTemporary) await rm(temporaryRoot, { recursive: true, force: true })
      else console.log(`Temporary consumers retained at ${temporaryRoot}`)
    }
  }

  console.log(JSON.stringify(report, null, 2))
  const failed = report.consumers.some(consumer => consumer.status === 'failed')
  if (failed) process.exitCode = 1
}

main().catch((error) => {
  console.error(`[audit:consumers] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
