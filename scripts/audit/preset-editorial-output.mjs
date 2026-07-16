import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

async function outputEvidence(name) {
  const output = resolve('tests/fixtures', `${name}-consumer/.output`)
  const files = await readdir(output, { recursive: true })
  const adminCss = files.filter(file => /(?:^|\/)admin-ui\.[^.]+\.css$/u.test(file))
  const paragraphEditRoutes = files.filter(file =>
    /server\/chunks\/routes\/api\/paragraph\/.+\/text\.(?:get|post)\.mjs$/u.test(file),
  )
  const searchable = files.filter(file => /\.(?:css|js|mjs)$/u.test(file))
  const markerFiles = []

  for (const file of searchable) {
    const contents = await readFile(resolve(output, file), 'utf8')

    if (contents.includes('admin-ui-controls')) markerFiles.push(file)
  }

  return { adminCss, markerFiles, paragraphEditRoutes }
}

const minimal = await outputEvidence('minimal')
const full = await outputEvidence('full')

if (
  minimal.adminCss.length > 0
  || minimal.markerFiles.length > 0
  || minimal.paragraphEditRoutes.length > 0
) {
  throw new Error('Minimal production output contains editorial assets or routes.')
}

if (
  full.adminCss.length === 0
  || full.markerFiles.length === 0
  || full.paragraphEditRoutes.length !== 2
) {
  throw new Error('Full production output is missing editorial assets or routes.')
}

process.stdout.write(`${JSON.stringify({ minimal, full }, null, 2)}\n`)
