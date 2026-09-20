#!/usr/bin/env node
/**
 * Lists consumer components that shadow a layer component.
 *
 * Nuxt resolves a component by name, and the most downstream file wins, so a
 * site file whose resolved name matches a layer file silently replaces it —
 * and then drifts from it. This prints those pairs with both line counts, so
 * a fork is a decision someone made rather than something discovered when a
 * deploy fails.
 *
 * Usage: node scripts/audit/shadowed-components.mjs <consumer-dir> [...]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'

const layerRoot = resolve(import.meta.dirname, '../../layers')

/** Returns every .vue file under a directory. */
function vueFiles(dir) {
  const found = []

  const walk = (current) => {
    let entries

    try {
      entries = readdirSync(current)
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      const full = resolve(current, entry)

      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.vue')) found.push(full)
    }
  }

  walk(dir)
  return found
}

/**
 * Mirrors Nuxt's component naming: path segments are PascalCased and joined,
 * with a repeated prefix collapsed (Auth/AuthCard.vue -> AuthCard).
 */
function componentName(file, componentsDir) {
  const parts = relative(componentsDir, file).replace(/\.vue$/, '').split(sep)
  const pascal = parts.map(part =>
    part.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(''),
  )

  return pascal.reduce((name, part) =>
    name && part.startsWith(name.split(/(?=[A-Z])/).at(-1) || '') && part.startsWith(name)
      ? part
      : `${name}${part}`, '')
}

function index(dirs) {
  const byName = new Map()

  for (const dir of dirs) {
    for (const file of vueFiles(dir)) {
      byName.set(componentName(file, dir), file)
    }
  }

  return byName
}

const layerComponents = index(
  readdirSync(layerRoot)
    .map(layer => resolve(layerRoot, layer, 'app/components'))
    .filter(dir => {
      try {
        return statSync(dir).isDirectory()
      } catch {
        return false
      }
    }),
)

const consumers = process.argv.slice(2)

if (consumers.length === 0) {
  console.error('Usage: node scripts/audit/shadowed-components.mjs <consumer-dir> [...]')
  process.exit(1)
}

const lines = file => readFileSync(file, 'utf8').split('\n').length
let shadowed = 0

for (const consumer of consumers) {
  const consumerComponents = index([resolve(consumer, 'app/components')])
  const overlaps = [...consumerComponents]
    .filter(([name]) => layerComponents.has(name))
    .sort(([a], [b]) => a.localeCompare(b))

  console.log(`\n${consumer}: ${overlaps.length} shadowed`)

  for (const [name, file] of overlaps) {
    const layerFile = layerComponents.get(name)

    console.log(
      `  ${name}: site ${lines(file)} lines vs layer ${lines(layerFile)} `
      + `(${relative(layerRoot, layerFile)})`,
    )
    shadowed += 1
  }
}

process.exit(shadowed > 0 ? 0 : 0)
