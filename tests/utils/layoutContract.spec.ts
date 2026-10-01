import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guards how pages and layouts share app.vue's persistent <NuxtLayout>.
 *
 * app.vue renders one <NuxtLayout> around <NuxtPage>, and a signed-in first
 * load is rendered in the browser while that layout waits for the page. So:
 *
 * - A page that renders its own <NuxtLayout> needs the app-level layout
 *   switched off at the moment it mounts; a late switch shows two shells.
 *   Pages name their layout in definePageMeta or set it in route middleware.
 * - A layout or shell that moves the page slot to a different parent on
 *   changing state remounts the page mid-load, and Vue never resolves the
 *   layout: the page stays on the loader with no error (found on DancePlug,
 *   2026-09-30).
 *
 * Consumer projects should carry the same test for their own app/ directory.
 */

const rootDir = resolve(__dirname, '../..')

function vueFiles(dir: string, match: (path: string) => boolean): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)

    if (statSync(path).isDirectory()) return vueFiles(path, match)

    return path.endsWith('.vue') && match(path) ? [path] : []
  })
}

function template(path: string): string {
  const source = readFileSync(path, 'utf8')

  return source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'))
}

/** Default (unnamed) slot tags, with their attributes. */
function defaultSlots(markup: string): string[] {
  return [...markup.matchAll(/<slot(\s[^>]*)?\/?>/g)]
    .map(match => match[1] ?? '')
    .filter(attributes => !/(^|\s):?name=/.test(attributes))
}

const layers = resolve(rootDir, 'layers')

describe('layout contract', () => {
  it('layer pages choose their layout in page meta, never by rendering <NuxtLayout>', () => {
    const offenders = vueFiles(layers, path => /\/app\/(pages|routes)\//.test(path))
      .filter(path => /<NuxtLayout[\s>]/.test(template(path)))
      .map(path => relative(rootDir, path))

    expect(offenders).toEqual([])
  })

  it('layouts and shells never move the page slot on changing state', () => {
    const files = vueFiles(layers, path => /\/app\/layouts\//.test(path) || path.endsWith('Shell.vue'))
    const offenders = files.flatMap((path) => {
      const slots = defaultSlots(template(path))
      const file = relative(rootDir, path)

      return [
        ...slots.some(attributes => /\sv-(if|else-if|else)\b/.test(attributes)) ? [`${file}: the page slot is conditional`] : [],
        ...slots.length > 1 ? [`${file}: the page slot appears ${slots.length} times`] : [],
      ]
    })

    expect(files.length, 'the guard found the layer layouts').toBeGreaterThan(3)
    expect(offenders).toEqual([])
  })

  it('app.vue renders the one layout around the page', () => {
    const app = template(resolve(layers, 'theme/app/app.vue'))

    expect(app.match(/<NuxtLayout[\s>]/g)).toHaveLength(1)
    expect(app).toMatch(/<NuxtLayout>\s*<NuxtPage\s*\/>\s*<\/NuxtLayout>/)
  })
})
