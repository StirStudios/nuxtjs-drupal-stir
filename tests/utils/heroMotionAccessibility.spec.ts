import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const heroSource = readFileSync(
  resolve(
    process.cwd(),
    'layers/theme/app/components/global/Paragraph/Hero.vue',
  ),
  'utf8',
)
const pageRouteSource = readFileSync(
  resolve(
    process.cwd(),
    'layers/theme/app/components/Drupal/PageRoute.vue',
  ),
  'utf8',
)
const nodeDisplaySource = readFileSync(
  resolve(
    process.cwd(),
    'layers/theme/app/components/Drupal/NodeDisplay.vue',
  ),
  'utf8',
)

describe('hero reveal accessibility', () => {
  it('keeps explicitly animated hero content visible with reduced motion', () => {
    expect(heroSource).toContain('motion-reduce:!opacity-100')
    expect(heroSource).toContain('motion-reduce:!transform-none')
  })

  it('uses an SSR entrance animation instead of a viewport reveal', () => {
    expect(heroSource).toContain('ssrVisible: false')
    expect(heroSource).toContain('trigger: \'enter\'')
  })

  it('keeps page animation around before-main and after-main content', () => {
    expect(nodeDisplaySource).toContain('area="before_main"')
    expect(pageRouteSource).toMatch(
      /<PageRevealScope[\s\S]*area="after_main"[\s\S]*<\/PageRevealScope>/,
    )
  })

  it('opts editorial sub-footer blocks into page animation', () => {
    expect(pageRouteSource).toMatch(
      /<PageRevealScope[\s\S]*area="sub_footer"[\s\S]*<\/PageRevealScope>/,
    )
  })
})
