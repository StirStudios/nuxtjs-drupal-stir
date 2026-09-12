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
import Ajv from 'ajv'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
// --check compares the committed snapshot against the producer without
// writing, so CI can fail on drift instead of discovering it at runtime.
const checkOnly = args.includes('--check')
const sourceArgument = args.find(argument => !argument.startsWith('--'))
const source = resolve(
  sourceArgument
    || process.env.STIR_TOOLS_CONTRACTS_DIR
    || '',
)

if (!sourceArgument && !process.env.STIR_TOOLS_CONTRACTS_DIR) {
  throw new Error(
    'Provide the Stir Tools contract directory as an argument or STIR_TOOLS_CONTRACTS_DIR.',
  )
}

const manifestPath = resolve(source, 'manifest.json')
const manifestSchemaPath = resolve(
  source,
  'schemas/contract-manifest.schema.json',
)

if (!existsSync(manifestPath)) {
  throw new Error(`Missing contract manifest: ${manifestPath}`)
}

if (!existsSync(manifestSchemaPath)) {
  throw new Error(`Missing contract manifest schema: ${manifestSchemaPath}`)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const manifestSchema = JSON.parse(readFileSync(manifestSchemaPath, 'utf8'))
const ajv = new Ajv({ allErrors: true, schemaId: 'auto' })
const validateManifest = ajv.compile(manifestSchema)

if (!validateManifest(manifest)) {
  throw new Error(
    `Invalid Stir Tools contract manifest: ${ajv.errorsText(validateManifest.errors)}`,
  )
}

for (const [id, contract] of Object.entries(manifest.contracts ?? {})) {
  if (!Object.hasOwn(manifest.capabilities, contract.capability)) {
    throw new Error(
      `Contract ${id} references unknown capability: ${String(contract.capability)}`,
    )
  }

  const referenced = [contract.schema, ...(contract.fixtures ?? [])]

  for (const path of referenced) {
    if (typeof path !== 'string' || !existsSync(resolve(source, path))) {
      throw new Error(`Contract ${id} references a missing file: ${String(path)}`)
    }
  }
}

const destination = resolve(root, 'contracts/stir-tools/v1')

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

function hashContractFiles(path) {
  return Object.fromEntries(
    contractFiles(path).map((file) => [
      relative(path, file).replaceAll('\\', '/'),
      createHash('sha256').update(readFileSync(file)).digest('hex'),
    ]),
  )
}

if (checkOnly) {
  const snapshotPath = resolve(destination, 'snapshot.json')

  if (!existsSync(snapshotPath)) {
    throw new Error(
      `Missing contract snapshot: ${relative(root, snapshotPath)}. Run pnpm contracts:sync.`,
    )
  }

  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'))
  const producerFiles = hashContractFiles(source)
  const drift = []

  if (snapshot.contractVersion !== manifest.contractVersion) {
    drift.push(
      `contract version: snapshot ${String(snapshot.contractVersion)} `
      + `!= producer ${String(manifest.contractVersion)}`,
    )
  }

  for (const [file, hash] of Object.entries(producerFiles)) {
    if (!Object.hasOwn(snapshot.files ?? {}, file)) {
      drift.push(`added upstream: ${file}`)
    } else if (snapshot.files[file] !== hash) {
      drift.push(`changed upstream: ${file}`)
    }
  }

  for (const file of Object.keys(snapshot.files ?? {})) {
    if (!Object.hasOwn(producerFiles, file)) {
      drift.push(`removed upstream: ${file}`)
    }
  }

  if (drift.length > 0) {
    console.error(
      `Stir Tools contract snapshot is out of date:\n- ${drift.join('\n- ')}`
      + '\n\nRun pnpm contracts:sync <stir-tools>/contracts/v1 and commit the result.',
    )
    process.exit(1)
  }

  console.log(
    `Stir Tools contract ${manifest.contractVersion} matches the committed snapshot.`,
  )
}
else {
  rmSync(destination, { force: true, recursive: true })
  cpSync(source, destination, { recursive: true })

  writeFileSync(
    resolve(destination, 'snapshot.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      producer: manifest.producer,
      contractVersion: manifest.contractVersion,
      files: hashContractFiles(destination),
    }, null, 2)}\n`,
  )

  console.log(
    `Synced Stir Tools contract ${manifest.contractVersion} to ${relative(root, destination)}`,
  )
}
