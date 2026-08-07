import { describe, expect, it, vi } from 'vitest'
import {
  optimizeDrupalRichTextImages,
  trustedDrupalHtml,
} from '../../layers/theme/app/utils/trustedDrupalHtml'

describe('trustedDrupalHtml', () => {
  it('preserves Drupal-filtered markup exactly', () => {
    const markup = '<p class="lead">Text</p><iframe src="https://example.com" />'

    expect(trustedDrupalHtml(markup)).toBe(markup)
  })

  it('normalizes missing markup to an empty string', () => {
    expect(trustedDrupalHtml()).toBe('')
    expect(trustedDrupalHtml(null)).toBe('')
  })
})

describe('optimizeDrupalRichTextImages', () => {
  it('uses structured Drupal media metadata and removes legacy responsive styles', () => {
    const resolve = vi.fn(() => ({
      sizes: '(max-width: 768px) 100vw, 1200px',
      src: '/_ipx/f_webp&s_1200x800/https://cdn.example/image.jpg?v=42',
      srcset: '/_ipx/f_webp&s_640x427/https://cdn.example/image.jpg?v=42 640w',
    }))
    const html = '<drupal-media class="align-left" data-media-type="image" data-original-src="https://cdn.example/image.jpg" data-original-revision="42"><img class="stir-rich-text-media-element stir-rich-text-media-image" src="/styles/1024/image.webp" srcset="/styles/640/image.webp 640w" width="1200" height="800" alt="Example"></drupal-media>'
    const result = optimizeDrupalRichTextImages(html, resolve, {
      baseClass: 'relative w-full object-cover',
      roundedClass: 'rounded-xl',
    })

    expect(resolve).toHaveBeenCalledWith(
      'https://cdn.example/image.jpg?v=42',
      1200,
      800,
      {
        alignment: 'left',
        containerClass: undefined,
        structured: true,
      },
    )
    expect(result).toContain('data-nuxt-img=""')
    expect(result).toContain('class="stir-rich-text-media-element stir-rich-text-media-image relative w-full object-cover rounded-xl"')
    expect(result).toContain('src="/_ipx/f_webp&s_1200x800/https://cdn.example/image.jpg?v=42"')
    expect(result).not.toContain('/styles/')
    expect(result).not.toContain('originalsrc')
  })

  it('styles structured images without requiring optimization metadata', () => {
    const html = '<drupal-media data-media-type="image"><img class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm" src="/inline.jpg" alt="Example"></drupal-media>'
    const result = optimizeDrupalRichTextImages(html, vi.fn(), {
      baseClass: 'relative w-full object-cover',
      roundedClass: 'rounded-xl',
    })

    expect(result).toContain(
      'class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm relative w-full object-cover rounded-xl"',
    )
  })

  it('layers responsive author corner styles over the theme default', () => {
    const html = '<drupal-media data-media-type="image"><img class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm md:rounded-none" src="/inline.jpg" alt="Example"></drupal-media>'
    const result = optimizeDrupalRichTextImages(html, vi.fn(), {
      baseClass: 'relative w-full object-cover',
      roundedClass: 'rounded-xl',
    })

    expect(result).toContain(
      'class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm md:rounded-none relative w-full object-cover rounded-xl"',
    )
  })

  it('preserves an explicit unprefixed author corner style', () => {
    const html = '<drupal-media data-media-type="image"><img class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm rounded-none" src="/inline.jpg" alt="Example"></drupal-media>'
    const result = optimizeDrupalRichTextImages(html, vi.fn(), {
      baseClass: 'relative w-full object-cover',
      roundedClass: 'rounded-xl',
    })

    expect(result).toContain(
      'class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm rounded-none relative w-full object-cover"',
    )
    expect(result).not.toContain('rounded-xl')
  })

  it('uses the Drupal semantic hook without requiring a media wrapper', () => {
    const html = '<figure><img class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm" src="/inline.jpg" alt="Example"></figure>'
    const result = optimizeDrupalRichTextImages(html, vi.fn(), {
      baseClass: 'relative w-full object-cover',
      roundedClass: 'rounded-xl',
    })

    expect(result).toContain(
      'class="stir-rich-text-media-element stir-rich-text-media-image shadow-sm relative w-full object-cover rounded-xl"',
    )
  })

  it('keeps media associations correct across complex sibling markup', () => {
    const html = '<div class="grid md:grid-cols-2"><section><drupal-media data-media-type="image"><figure><img class="stir-rich-text-media-element stir-rich-text-media-image first" src="/first.jpg"></figure></drupal-media></section><aside><div><img class="ordinary" src="/ordinary.jpg"></div></aside><drupal-media data-media-type="image"><img class="stir-rich-text-media-element stir-rich-text-media-image second rounded-none" src="/second.jpg"></drupal-media></div>'
    const result = optimizeDrupalRichTextImages(html, vi.fn(), {
      baseClass: 'w-full',
      roundedClass: 'rounded-xl',
    })

    expect(result).toContain(
      'class="stir-rich-text-media-element stir-rich-text-media-image first w-full rounded-xl"',
    )
    expect(result).toContain('class="ordinary"')
    expect(result).toContain(
      'class="stir-rich-text-media-element stir-rich-text-media-image second rounded-none w-full"',
    )
  })

  it('does not process retired standalone legacy metadata', () => {
    const html = '<img src="/styles/card.webp" originalsrc="https://cdn.example/original.jpg" originalrevision="7" width="800" height="600">'
    const resolve = vi.fn()

    expect(optimizeDrupalRichTextImages(html, resolve)).toBe(html)
    expect(resolve).not.toHaveBeenCalled()
  })

  it('provides the nearest rich-text grid class as image context', () => {
    const resolve = vi.fn(() => ({
      src: '/_ipx/s_640x480/https://cdn.example/grid.jpg',
      srcset: '/_ipx/s_640x480/https://cdn.example/grid.jpg 640w',
    }))
    const html = '<div class="grid md:grid-cols-2 lg:grid-cols-3"><drupal-media data-original-src="https://cdn.example/grid.jpg"><img class="stir-rich-text-media-element stir-rich-text-media-image" src="/grid.jpg" width="1200" height="900"></drupal-media></div>'

    optimizeDrupalRichTextImages(html, resolve)

    expect(resolve).toHaveBeenCalledWith(
      'https://cdn.example/grid.jpg',
      1200,
      900,
      {
        alignment: undefined,
        containerClass: 'grid md:grid-cols-2 lg:grid-cols-3',
        structured: true,
      },
    )
  })

  it('leaves ordinary trusted HTML untouched', () => {
    const html = '<p>Copy</p><img src="/local/image.jpg" alt="Example">'

    expect(optimizeDrupalRichTextImages(html, vi.fn())).toBe(html)
  })
})
