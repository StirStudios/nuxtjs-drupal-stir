import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import RevealMotion from '../../../layers/theme/app/components/RevealMotion.vue'

describe('RevealMotion (Nuxt runtime)', () => {
  it('forwards motion attributes during server rendering', async () => {
    const html = await renderToString(
      h(
        RevealMotion,
        {
          asChild: true,
          initial: { opacity: 0, y: 100 },
          whileInView: { opacity: 1, y: 0 },
        },
        {
          default: () => h('div', { class: 'reveal-child' }),
        },
      ),
    )

    expect(html).toContain('class="reveal-motion reveal-child"')
    expect(html).toContain('style="opacity:0;transform:translateY(100px);"')
  })

  it('shows hidden reveals when scripting is off', () => {
    const css = readFileSync(resolve(process.cwd(), 'layers/theme/app/assets/css/reveal.css'), 'utf8')
    const index = readFileSync(resolve(process.cwd(), 'layers/theme/app/assets/css/main.css'), 'utf8')

    expect(index).toContain('@import \'./reveal\';')
    expect(css).toMatch(/@media \(scripting: none\) \{\s*\.reveal-motion \{\s*opacity: 1 !important;\s*transform: none !important;/)
  })
})
