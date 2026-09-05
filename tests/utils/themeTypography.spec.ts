import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(resolve(process.cwd(), 'layers/theme/app', path), 'utf8')

describe('shared theme typography and containment', () => {
  it('lets Nuxt UI own dimmed text and keeps ordinary media in the base layer', () => {
    expect(source('assets/css/utilities.css')).not.toContain('@utility text-dimmed')
    expect(source('assets/css/media.css')).toContain('@layer base')
    expect(source('assets/css/media.css')).not.toContain('!mb-4')
  })

  it('contains page motion without clipping every section', () => {
    expect(source('assets/css/base.css')).not.toContain('overflow-x-clip')
    expect(source('layouts/default.vue')).toContain('flex-col overflow-x-clip')
    expect(source('layouts/clear.vue')).toContain('flex-col overflow-x-clip')
  })

  it('respects reduced motion for menu panels and media zoom', () => {
    expect(source('assets/css/motion.css')).toMatch(/prefers-reduced-motion: reduce[\s\S]*\.stir-menu-panel\[data-state\][\s\S]*animation: none !important/)
    expect(source('assets/css/utilities.css')).toContain('motion-safe:scale-105')
  })

  it('scopes media appearance to media-backed heroes', () => {
    expect(source('app.config.ts')).toContain('mediaAppearance: \'dark text-default\'')
    expect(source('components/global/Paragraph/Hero.vue')).toContain('hasMediaSlot.value && heroTheme.mediaAppearance')
    expect(source('components/HeroContent.vue')).not.toContain('text-white')
    expect(source('assets/css/utilities.css')).not.toContain('.front')
  })
})
