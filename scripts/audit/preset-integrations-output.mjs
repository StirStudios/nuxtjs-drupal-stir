import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

async function outputEvidence(name) {
  const output = resolve('tests/fixtures', `${name}-consumer/.output`)
  const files = await readdir(output, { recursive: true })
  const searchable = files.filter(file => /\.(?:js|mjs)$/u.test(file))
  const integrationFiles = []
  const consentFiles = []

  for (const file of searchable) {
    const contents = await readFile(resolve(output, file), 'utf8')

    if (contents.includes('layers/integrations/')) integrationFiles.push(file)
    if (contents.includes('cookie_consent')) consentFiles.push(file)
  }

  return { consentFiles, integrationFiles }
}

const minimal = await outputEvidence('minimal')
const full = await outputEvidence('full')

if (minimal.integrationFiles.length > 0 || minimal.consentFiles.length > 0) {
  throw new Error(
    'Minimal production output contains optional popup/privacy integration code.',
  )
}

if (full.integrationFiles.length === 0 || full.consentFiles.length === 0) {
  throw new Error(
    'Full production output is missing popup/privacy integration code.',
  )
}

process.stdout.write(`${JSON.stringify({ minimal, full }, null, 2)}\n`)
