#!/usr/bin/env node

import { access, copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(process.cwd())
const templateRoot = fileURLToPath(new URL('./templates/', import.meta.url))
const files = ['site.json', 'REVIEW.md']
const created = []
const preserved = []

await mkdir(resolve(projectRoot, 'compliance'), { recursive: true })

for (const file of files) {
  const destination = resolve(projectRoot, 'compliance', file)

  try {
    await access(destination)
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
for (const file of preserved) console.log(`KEEP   compliance/${file} (already exists)`)

if (created.length) {
  console.log('NEXT   Replace every REPLACE_* value with verified project facts, then run stir-compliance.')
}
