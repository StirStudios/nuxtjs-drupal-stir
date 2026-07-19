import { describe, expect, it } from 'vitest'
import { createParagraphComponentStarter } from '../../layers/theme/app/utils/componentTreeDiagnostics'

describe('createParagraphComponentStarter', () => {
  it('generates typed props and the named slots present in Drupal data', () => {
    const starter = createParagraphComponentStarter({
      id: 96,
      portfolio: 'Production',
      settings: { featured: true },
    }, ['hero', 'section'])

    expect(starter).toContain('"id"?: number')
    expect(starter).toContain('"portfolio"?: string')
    expect(starter).toContain('"settings"?: Record<string, unknown>')
    expect(starter).toContain('<slot name="hero" />')
    expect(starter).toContain('<slot name="section" />')
  })
})
