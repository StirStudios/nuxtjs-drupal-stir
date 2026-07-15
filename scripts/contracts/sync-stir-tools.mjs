import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const source = resolve(
  process.argv[2]
    || process.env.STIR_TOOLS_CONTRACTS_DIR
    || '',
)

if (!process.argv[2] && !process.env.STIR_TOOLS_CONTRACTS_DIR) {
  throw new Error(
    'Provide the Stir Tools contract directory as an argument or STIR_TOOLS_CONTRACTS_DIR.',
  )
}

const manifestPath = resolve(source, 'manifest.json')

if (!existsSync(manifestPath)) {
  throw new Error(`Missing contract manifest: ${manifestPath}`)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

if (manifest.schemaVersion !== 1 || typeof manifest.contractVersion !== 'string') {
  throw new Error('Unsupported Stir Tools contract manifest.')
}

for (const [id, contract] of Object.entries(manifest.contracts ?? {})) {
  const referenced = [contract.schema, ...(contract.fixtures ?? [])]

  for (const path of referenced) {
    if (typeof path !== 'string' || !existsSync(resolve(source, path))) {
      throw new Error(`Contract ${id} references a missing file: ${String(path)}`)
    }
  }
}

const destination = resolve(root, 'contracts/stir-tools/v1')
rmSync(destination, { force: true, recursive: true })
cpSync(source, destination, { recursive: true })

function contractFiles(path) {
  const files = []

  for (const entry of readdirSync(path).sort()) {
    const absolute = resolve(path, entry)

    if (statSync(absolute).isDirectory()) {
      files.push(...contractFiles(absolute))
    } else if (entry !== 'snapshot.json') {
      files.push(absolute)
    }
  }

  return files
}

const files = Object.fromEntries(
  contractFiles(destination).map((path) => [
    relative(destination, path).replaceAll('\\', '/'),
    createHash('sha256').update(readFileSync(path)).digest('hex'),
  ]),
)

writeFileSync(
  resolve(destination, 'snapshot.json'),
  `${JSON.stringify({
    schemaVersion: 1,
    producer: manifest.producer,
    contractVersion: manifest.contractVersion,
    files,
  }, null, 2)}\n`,
)

console.log(
  `Synced Stir Tools contract ${manifest.contractVersion} to ${relative(root, destination)}`,
)
