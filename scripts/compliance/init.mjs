#!/usr/bin/env node

import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(process.cwd())
const templateRoot = fileURLToPath(new URL('./templates/', import.meta.url))
const files = ['site.json', 'REVIEW.md']
const created = []
const preserved = []
const updated = []
const discoveryMarker = '<!-- stir-compliance-discovery:v1 -->'

await mkdir(resolve(projectRoot, 'compliance'), { recursive: true })

for (const file of files) {
  const destination = resolve(projectRoot, 'compliance', file)

  try {
    await access(destination)

    if (file === 'REVIEW.md') {
      const existing = await readFile(destination, 'utf8')

      if (!existing.includes(discoveryMarker)) {
        const template = await readFile(resolve(templateRoot, file), 'utf8')
        const sectionStart = template.indexOf('## Required service discovery')
        const sectionEnd = template.indexOf('## Human confirmations')

        if (sectionStart >= 0 && sectionEnd > sectionStart) {
          const discoverySection = template.slice(sectionStart, sectionEnd)
          const insertionPoint = existing.indexOf('## Human confirmations')
          const migrated = insertionPoint >= 0
            ? `${existing.slice(0, insertionPoint)}${discoverySection}${existing.slice(insertionPoint)}`
            : `${existing.trimEnd()}\n\n${discoverySection}`

          await writeFile(destination, migrated)
          updated.push(file)
          continue
        }
      }
    }

    preserved.push(file)
  }
  catch {
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(resolve(templateRoot, file), destination)
    created.push(file)
  }
}

console.log('Stir compliance setup')
for (const file of created) console.log(`CREATE compliance/${file}`)
for (const file of updated) console.log(`UPDATE compliance/${file} (service discovery v1)`)
for (const file of preserved) console.log(`KEEP   compliance/${file} (already exists)`)

if (created.length) {
  console.log('NEXT   Replace every REPLACE_* value with verified project facts, then run stir-compliance.')
}
