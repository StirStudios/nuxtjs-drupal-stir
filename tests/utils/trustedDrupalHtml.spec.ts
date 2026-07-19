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
    const html = '<drupal-media data-media-type="image" data-original-src="https://cdn.example/image.jpg" data-original-revision="42"><img src="/styles/1024/image.webp" srcset="/styles/640/image.webp 640w" width="1200" height="800" alt="Example"></drupal-media>'
    const result = optimizeDrupalRichTextImages(html, resolve)

    expect(resolve).toHaveBeenCalledWith(
      'https://cdn.example/image.jpg?v=42',
      1200,
      800,
    )
    expect(result).toContain('data-nuxt-img=""')
    expect(result).toContain('src="/_ipx/f_webp&amp;s_1200x800/https://cdn.example/image.jpg?v=42"')
    expect(result).not.toContain('/styles/')
    expect(result).not.toContain('originalsrc')
  })

  it('supports legacy standalone image metadata during fleet migration', () => {
    const html = '<img src="/styles/card.webp" originalsrc="https://cdn.example/original.jpg" originalrevision="7" width="800" height="600">'
    const result = optimizeDrupalRichTextImages(html, () => ({
      src: '/_ipx/s_800x600/https://cdn.example/original.jpg?v=7',
      srcset: '/_ipx/s_400x300/https://cdn.example/original.jpg?v=7 400w',
    }))

    expect(result).toContain('data-nuxt-img=""')
    expect(result).toContain('/_ipx/s_800x600/')
    expect(result).not.toContain('/styles/card.webp')
  })

  it('leaves ordinary trusted HTML untouched', () => {
    const html = '<p>Copy</p><img src="/local/image.jpg" alt="Example">'

    expect(optimizeDrupalRichTextImages(html, vi.fn())).toBe(html)
  })
})
