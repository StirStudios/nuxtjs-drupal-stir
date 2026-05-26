import { describe, expect, it } from 'vitest'
import {
  menuItemTo,
  normalizeInternalMenuPath,
} from '../../layers/theme/app/utils/navigation'

describe('normalizeInternalMenuPath', () => {
  it('returns root path when value is empty or front', () => {
    expect(normalizeInternalMenuPath()).toBe('/')
    expect(normalizeInternalMenuPath('')).toBe('/')
    expect(normalizeInternalMenuPath('<front>')).toBe('/')
  })

  it('normalizes relative aliases and Drupal URI prefixes', () => {
    expect(normalizeInternalMenuPath('/events')).toBe('/events')
    expect(normalizeInternalMenuPath('events')).toBe('/events')
    expect(normalizeInternalMenuPath('internal:/events')).toBe('/events')
    expect(normalizeInternalMenuPath('base:/events')).toBe('/events')
  })

  it('normalizes absolute menu URLs to local paths', () => {
    expect(normalizeInternalMenuPath('https://nuxt.example.local/events')).toBe('/events')
    expect(normalizeInternalMenuPath('https://nuxt.example.local/events?month=may#details')).toBe('/events?month=may#details')
  })

  it('preserves configured fragments', () => {
    expect(normalizeInternalMenuPath('https://nuxt.example.local/', 'kitchens')).toBe('/#kitchens')
    expect(normalizeInternalMenuPath('/book', '##contact')).toBe('/book#contact')
  })
})

describe('menuItemTo', () => {
  it('uses the Drupal menu URL fallback order', () => {
    expect(menuItemTo({ relative: 'https://nuxt.example.local/events', alias: 'ignored' })).toBe('/events')
    expect(menuItemTo({ alias: 'events' })).toBe('/events')
  })

  it('keeps external and protocol links', () => {
    expect(menuItemTo({ external: true, absolute: 'https://example.com' })).toBe('https://example.com')
    expect(menuItemTo({ url: 'mailto:hello@example.com' })).toBe('mailto:hello@example.com')
    expect(menuItemTo({ url: 'tel:+15555555555' })).toBe('tel:+15555555555')
  })
})
