import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const fixturesDir = resolve(import.meta.dirname, '../../../fixtures')

// Fixtures that are also type-checked (`nuxi typecheck --cwd`) keep a
// tsconfig.json that references their generated .nuxt configs. Vite loads that
// tsconfig while @nuxt/test-utils builds the fixture, so on a clean checkout
// the build aborts with "Tsconfig not found" before any e2e test runs.
// Generate those configs once before the suite starts.
export default function prepareFixtures(): void {
  for (const entry of readdirSync(fixturesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const fixture = join(fixturesDir, entry.name)
    const tsconfig = join(fixture, 'tsconfig.json')

    if (!existsSync(join(fixture, 'nuxt.config.ts')) || !existsSync(tsconfig)) continue
    if (!readFileSync(tsconfig, 'utf8').includes('./.nuxt/')) continue
    if (existsSync(join(fixture, '.nuxt', 'tsconfig.app.json'))) continue

    execFileSync('pnpm', ['exec', 'nuxi', 'prepare', fixture], {
      stdio: 'inherit',
    })
  }
}
