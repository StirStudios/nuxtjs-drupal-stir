import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const paragraphDir = resolve(
  process.cwd(),
  'layers/theme/app/components/global/Paragraph',
)

const ownership = {
  self: [
    'Button.vue',
    'Calculator.vue',
    'Calendly.vue',
    'Enzuzo.vue',
    'Faq.vue',
    'Icon.vue',
    'InstagramFeed.vue',
    'Tabs.vue',
    'Timeline.vue',
  ],
  managed: ['Carousel.vue', 'Hero.vue', 'Layout.vue'],
  delegated: ['Media.vue', 'Text.vue', 'View.vue'],
  internal: [
    'Default.vue',
    'FaqItem.vue',
    'MediaModal.vue',
    'Tab.vue',
    'TimelineItem.vue',
  ],
} as const

describe('paragraph reveal ownership', () => {
  it('classifies every paragraph component', () => {
    const files = readdirSync(paragraphDir)
      .filter(file => file.endsWith('.vue'))
      .sort()
    const classified = Object.values(ownership).flat().sort()

    expect(classified).toEqual(files)
  })

  it('uses the shared reveal boundary for self-managed visual paragraphs', () => {
    for (const file of ownership.self) {
      const source = readFileSync(resolve(paragraphDir, file), 'utf8')

      expect(source, file).toContain('<ParagraphReveal')
    }
  })
})
