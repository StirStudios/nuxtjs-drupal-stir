import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(process.cwd())
const packageJsonPath = resolve(repoRoot, 'package.json')
const readmePath = resolve(repoRoot, 'readme.md')

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const deps = pkg.dependencies || {}

const nuxtVersion = deps.nuxt || 'unknown'
const nuxtUiVersion = deps['@nuxt/ui'] || 'unknown'
const tailwindVersion = deps.tailwindcss || 'unknown'
const drupalCeVersion = deps['nuxtjs-drupal-ce'] || 'unknown'
const nuxtUiDisplay = nuxtUiVersion.startsWith('https://pkg.pr.new/@nuxt/ui@')
  ? `pinned PR build (${nuxtUiVersion.split('@').at(-1) || nuxtUiVersion})`
  : nuxtUiVersion

const generatedBlock = [
  '- **[Nuxt 4](https://nuxt.com/)**: `' + nuxtVersion + '`',
  '- **[Nuxt UI 4](https://ui.nuxt.com/)**: `' + nuxtUiDisplay + '`',
  '- **[Tailwind CSS 4](https://tailwindcss.com/)**: `' + tailwindVersion + '`',
  '- **[nuxtjs-drupal-ce](https://github.com/drunomics/nuxtjs-drupal-ce)**: `' + drupalCeVersion + '`',
  '- **[Vite](https://vitejs.dev/)** + **[Nitro](https://nitro.unjs.io/)**: provided by Nuxt build/runtime for asset optimization',
].join('\n')

const startToken = '<!-- tech-stack:start -->'
const endToken = '<!-- tech-stack:end -->'

const readme = readFileSync(readmePath, 'utf8')
const pattern = new RegExp(`${startToken}[\\s\\S]*?${endToken}`, 'm')

if (!pattern.test(readme)) {
  throw new Error('Tech stack tokens not found in readme.md')
}

const updated = readme.replace(
  pattern,
  `${startToken}\n${generatedBlock}\n${endToken}`,
)

if (updated !== readme) {
  writeFileSync(readmePath, updated)
}

console.log('Synced Tech Stack section in readme.md from package.json')
