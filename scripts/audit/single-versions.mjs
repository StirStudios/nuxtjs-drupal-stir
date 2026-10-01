#!/usr/bin/env node
/**
 * Fails when a lockfile resolves a Tiptap package to more than one version.
 *
 * Tiptap extensions pin their peers to an exact version, so a partial update
 * leaves an older tree beside the new one, and `pnpm update` does not remove
 * it. The older copy keeps shipping, security advisories included, until
 * someone notices. A single resolved version per package means every Tiptap
 * fix reaches the bundle.
 *
 * Usage: node scripts/audit/single-versions.mjs [--fix] [path/to/pnpm-lock.yaml]
 *
 * --fix drops every Tiptap entry from the lockfile, not only the duplicated
 * ones: a package still locked to the old release would pull the old tree back
 * in through its exact peers. The next `pnpm install` then resolves the whole
 * family afresh to the newest version every range allows.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PREFIXES = ['@tiptap/']

const args = process.argv.slice(2)
const fix = args.includes('--fix')
const lockfile = resolve(
  args.find((arg) => arg !== '--fix') ??
    resolve(import.meta.dirname, '../../pnpm-lock.yaml'),
)
const content = readFileSync(lockfile, 'utf8')
const versions = new Map()

// Package entries look like `  '@tiptap/core@3.31.4':` (peer suffixes follow).
for (const [, name, version] of content.matchAll(
  /^ {2}'?(@?[^@\s']+)@(\d[^(':\s]*)/gm,
)) {
  if (!PREFIXES.some((prefix) => name.startsWith(prefix))) continue
  if (!versions.has(name)) versions.set(name, new Set())
  versions.get(name).add(version)
}

const duplicated = [...versions].filter(([, found]) => found.size > 1)

if (duplicated.length && fix) {
  const names = new Set(versions.keys())
  // Each entry is its key line plus the indented lines below it.
  const kept = content.replace(
    /^ {2}'?(@?[^@\s']+)@[^\n]*:\n(?:(?: {4}[^\n]*)?\n)*?(?=^ {2}\S|^\S|(?![\s\S]))/gm,
    (entry, name) => (names.has(name) ? '' : entry),
  )
  writeFileSync(lockfile, kept)
  console.log(
    `Dropped ${names.size} ${PREFIXES.join(', ')} packages from ${lockfile}; run pnpm install to resolve them afresh.`,
  )
  process.exit(0)
}

if (duplicated.length) {
  for (const [name, found] of duplicated) {
    console.error(`${name}: ${[...found].sort().join(', ')}`)
  }
  console.error(
    `\n${lockfile} resolves these packages to more than one version.`,
  )
  console.error(
    'Fix: node scripts/audit/single-versions.mjs --fix <lockfile>, then pnpm install.',
  )
  process.exit(1)
}

console.log(`One version of each ${PREFIXES.join(', ')} package.`)
