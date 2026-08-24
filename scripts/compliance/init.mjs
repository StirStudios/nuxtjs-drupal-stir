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
const reviewSections = [
  {
    heading: '## Required service discovery',
    marker: '<!-- stir-compliance-discovery:v1 -->',
    nextHeading: '## Required accessibility review',
  },
  {
    heading: '## Required accessibility review',
    marker: '<!-- stir-compliance-accessibility:v1 -->',
    nextHeading: '## Human confirmations',
  },
]

await mkdir(resolve(projectRoot, 'compliance'), { recursive: true })

for (const file of files) {
  const destination = resolve(projectRoot, 'compliance', file)

  try {
    await access(destination)

    if (file === 'REVIEW.md') {
      let review = await readFile(destination, 'utf8')
      const template = await readFile(resolve(templateRoot, file), 'utf8')
      let changed = false

      for (const section of reviewSections) {
        if (review.includes(section.marker)) continue

        const templateStart = template.indexOf(section.heading)
        const templateEnd = template.indexOf(section.nextHeading, templateStart)
        if (templateStart < 0 || templateEnd <= templateStart) continue

        const currentStart = review.indexOf(section.heading)
        const nextSectionStart = currentStart >= 0
          ? review.indexOf('\n## ', currentStart + section.heading.length)
          : -1
        const preferredInsertionPoint = review.indexOf(section.nextHeading)
        const humanConfirmations = review.indexOf('## Human confirmations')
        const insertionPoint = preferredInsertionPoint >= 0
          ? preferredInsertionPoint
          : humanConfirmations
        const replacement = template.slice(templateStart, templateEnd)
        review = currentStart >= 0
          ? `${review.slice(0, currentStart)}${replacement}${review.slice(nextSectionStart >= 0 ? nextSectionStart + 1 : review.length)}`
          : insertionPoint >= 0
            ? `${review.slice(0, insertionPoint)}${replacement}${review.slice(insertionPoint)}`
            : `${review.trimEnd()}\n\n${replacement}`
        changed = true
      }

      if (changed) {
        await writeFile(destination, review)
        updated.push(file)
        continue
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
for (const file of updated) console.log(`UPDATE compliance/${file} (current review checklists)`)
for (const file of preserved) console.log(`KEEP   compliance/${file} (already exists)`)

if (created.length) {
  console.log('NEXT   Replace every REPLACE_* value with verified project facts, then run stir-compliance.')
}
