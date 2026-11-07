import { describe, expect, it } from 'vitest'
import {
  buildLlmsTxt,
  collectLlmsTxtLinks,
  LLMS_TXT_MAX_PAGES,
} from '../../layers/seo/server/utils/llmsTxt'
import { parsePageSummaries } from '../../layers/seo/server/utils/pageSummaryApi'

const siteUrl = 'https://example.com'

const page = (loc: string, priority: number | null = null) => ({
  loc,
  lastmod: null,
  changefreq: null,
  priority,
})

describe('llms.txt', () => {
  it('links the menu and top pages with their titles and descriptions', () => {
    const links = collectLlmsTxtLinks(
      [
        { title: 'About [us]', relative: '/about' },
        { title: 'Shop', absolute: 'https://shop.example.net/about' },
        { title: '', relative: '/untitled' },
        { title: 'Try free', relative: '/about#trial' },
        { title: 'Log in', relative: '/auth/login' },
      ],
      [
        page('https://example.com/', 1),
        page('https://example.com/news/item', 1),
        page('https://example.com/news', 0.3),
        page('https://example.com/about', 0.9),
        page('/classes/yoga', 0.8),
      ],
      siteUrl,
    )

    expect(buildLlmsTxt({
      name: 'Example Site',
      slogan: '',
      siteUrl,
      links,
      summaries: parsePageSummaries([
        { path: '/', title: 'Home', description: 'Classes\n for everyone.' },
        { path: '/about', title: 'About', description: 'Who we are.' },
        { path: '/classes/yoga', title: 'Yoga', description: null },
      ]),
    })).toBe([
      '# Example Site',
      '',
      '> Classes for everyone.',
      '',
      '## Main menu',
      '',
      '- [About us](https://example.com/about): Who we are.',
      '- [Shop](https://shop.example.net/about)',
      '',
      '## Optional',
      '',
      '- [/news](https://example.com/news)',
      '- [/news/item](https://example.com/news/item)',
      '- [Yoga](https://example.com/classes/yoga)',
      '',
    ].join('\n'))
  })

  it('keeps the slogan as the summary and the home description as a paragraph', () => {
    expect(buildLlmsTxt({
      name: 'Example Site',
      slogan: 'Dance for all',
      siteUrl,
      links: { menu: [], pages: [] },
      summaries: [{ path: '/', title: 'Home', description: 'Weekly classes.' }],
    })).toBe('# Example Site\n\n> Dance for all\n\nWeekly classes.\n')
  })

  it('caps pages and omits empty sections', () => {
    const sitemap = Array.from({ length: 40 }, (_, index) => page(`https://example.com/p${index}`))
    const output = buildLlmsTxt({
      name: '',
      slogan: '',
      siteUrl,
      links: collectLlmsTxtLinks([], sitemap, siteUrl),
      summaries: [],
    })

    expect(output.startsWith('# https://example.com\n\n## Optional')).toBe(true)
    expect(output).not.toContain('## Main menu')
    expect(output.match(/^- /gm)).toHaveLength(LLMS_TXT_MAX_PAGES)
  })

  it('rejects a summary payload outside the contract', () => {
    expect(() => parsePageSummaries([{ path: 'about', title: 'About', description: null }])).toThrow()
  })
})
