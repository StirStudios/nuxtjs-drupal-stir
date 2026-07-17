import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FOOTER_SECTIONS,
  DEFAULT_FOOTER_THEME,
  resolveFooterConfig,
} from '../../layers/theme/app/utils/footer'

describe('resolveFooterConfig', () => {
  it('returns independent default footer sections', () => {
    const first = resolveFooterConfig(undefined, undefined)
    const second = resolveFooterConfig(undefined, undefined)

    expect(first).toMatchObject(DEFAULT_FOOTER_THEME)
    expect(first.sections).toEqual(DEFAULT_FOOTER_SECTIONS)
    expect(first.sections.left).not.toBe(second.sections.left)
  })

  it('normalizes supported values and falls back for invalid values', () => {
    const config = resolveFooterConfig({
      layout: 'columns',
      showLogo: false,
      showMenu: 'yes',
      base: '  custom-footer  ',
      leftSlot: ' order-2 lg:order-1 ',
      rightSlot: ' order-1 lg:order-3 ',
      sections: {
        left: ['socials', 'socials', 'unknown'],
        center: null,
      },
    }, {
      logoClass: 'logo-default',
      logoScrolledClass: 'logo-scrolled',
    })

    expect(config.layout).toBe('columns')
    expect(config.showLogo).toBe(false)
    expect(config.showMenu).toBe(true)
    expect(config.base).toBe('custom-footer')
    expect(config.leftSlot).toBe('order-2 lg:order-1')
    expect(config.rightSlot).toBe('order-1 lg:order-3')
    expect(config.logoFromTheme).toBe('logo-scrolled')
    expect(config.sections).toEqual({
      left: ['socials'],
      center: DEFAULT_FOOTER_SECTIONS.center,
      right: DEFAULT_FOOTER_SECTIONS.right,
    })
  })

  it('allows explicitly empty footer sections', () => {
    const config = resolveFooterConfig({
      sections: { left: [], center: [], right: [] },
    }, {})

    expect(config.sections).toEqual({ left: [], center: [], right: [] })
  })
})
