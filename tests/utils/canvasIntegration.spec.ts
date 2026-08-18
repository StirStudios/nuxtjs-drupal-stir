import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')
const source = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('Canvas integration', () => {
  it('publishes only governed Stir components to the preview index', () => {
    const config = source('layers/platform/nuxt.config.ts')

    expect(config).toContain('process.env.STIR_CANVAS_ENABLED === \'true\'')
    expect(config).toContain('enableComponentPreview: canvasEnabled')
    expect(config).toContain('includePackages: true')
    expect(config).toContain('\'!stir-*\'')
    expect(config).toContain('\'stir-missing-component\'')
    expect(config).toContain('\'stir-native-element\'')
  })

  it.each([
    ['Hero', 'ParagraphHero'],
    ['RichText', 'ParagraphText'],
    ['Layout', 'ParagraphLayout'],
    ['Button', 'ParagraphButton'],
    ['MediaCollection', 'ParagraphMedia'],
  ])('keeps the %s Canvas contract backed by the shared %s renderer', (
    component,
    renderer,
  ) => {
    const componentSource = source(
      `layers/theme/app/components/global/Stir/${component}.vue`,
    )

    expect(componentSource).toContain(`<${renderer}`)
    expect(componentSource).not.toContain('class?:')
    expect(componentSource).not.toContain('gridClass?:')
  })

  it('provides a dynamic Drupal-rendered slot without frontend fetching', () => {
    const component = source(
      'layers/theme/app/components/global/Stir/DynamicContent.vue',
    )

    expect(component).toContain('<slot name="content" />')
    expect(component).not.toContain('$fetch')
  })

  it('keeps the Lupus Canvas page transport wrapper through hydration', () => {
    const component = source(
      'layers/theme/app/components/global/canvas-page.vue',
    )

    expect(component).toContain('<slot name="components">')
    expect(component).toContain('<slot />')
  })

  it('Hero supports Drupal Media Library image objects', () => {
    const componentSource = source('layers/theme/app/components/global/Stir/Hero.vue')

    expect(componentSource).toContain('image?: CanvasImage')
    expect(componentSource).toContain(':src="image.src"')
    expect(componentSource).toContain(':alt="image.alt || \'\'"')
  })

  it('MediaCollection supports direct SSR image media', () => {
    const componentSource = source('layers/theme/app/components/global/Stir/MediaCollection.vue')

    expect(componentSource).toContain('imageUrl?: string')
    expect(componentSource).toContain(':src="imageUrl"')
    expect(componentSource).toContain(':alt="imageAlt || \'\'"')
  })

  it('keeps empty Stir Layout columns visible as Canvas drop regions', () => {
    const componentSource = source('layers/theme/app/components/global/Stir/Layout.vue')

    expect(componentSource).toContain('layout: \'three-column\'')
    expect(componentSource.match(/class="stir-layout-drop-region"/g)).toHaveLength(3)
    expect(componentSource).toContain('min-height: 6rem')
  })
})
