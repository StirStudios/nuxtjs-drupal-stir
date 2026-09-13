import { describe, expect, it } from 'vitest'
import {
  extractHeaderActions,
  mapDrupalMenuItem,
  menuItemTo,
  normalizeInternalMenuPath,
  splitMenuAtMarker,
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

describe('mapDrupalMenuItem', () => {
  it('maps nested Drupal menu aliases and suppresses parent navigation', () => {
    expect(mapDrupalMenuItem({
      title: 'About',
      description: 'Learn more about us',
      alias: '/about',
      below: [{
        title: 'Team',
        description: 'Meet the people behind our work',
        alias: '/about/team',
      }],
    })).toEqual({
      label: 'About',
      description: 'Learn more about us',
      to: undefined,
      exact: false,
      exactHash: false,
      target: undefined,
      children: [{
        label: 'Team',
        description: 'Meet the people behind our work',
        to: '/about/team',
        exact: true,
        exactHash: false,
        target: undefined,
        children: undefined,
      }],
    })
  })

  it('keeps empty Drupal menu descriptions absent', () => {
    expect(mapDrupalMenuItem({
      title: 'Contact',
      description: '   ',
      alias: '/contact',
    })).toMatchObject({ description: undefined })
  })

  it('preserves external targets and hash matching', () => {
    expect(mapDrupalMenuItem({
      title: 'Details',
      alias: '/events#details',
    })).toMatchObject({ exact: true, exactHash: true })
    expect(mapDrupalMenuItem({
      title: 'Partner',
      external: true,
      absolute: 'https://example.com',
      options: { attributes: { target: '_self' } },
    })).toMatchObject({
      to: 'https://example.com',
      target: '_self',
    })
  })
})

describe('splitMenuAtMarker', () => {
  const items = [{ label: 'Work' }, { label: '--logo--' }, { label: 'Contact' }]

  it('partitions navigation around the marker', () => {
    expect(splitMenuAtMarker(items, '--logo--')).toEqual({
      before: [{ label: 'Work' }],
      after: [{ label: 'Contact' }],
      markerIndex: 1,
    })
  })

  it('returns the original navigation when the marker is absent', () => {
    expect(splitMenuAtMarker(items, 'missing')).toEqual({
      before: items,
      after: [],
      markerIndex: -1,
    })
  })
})

describe('extractHeaderActions', () => {
  const items = [{ label: 'Classes' }, { label: 'Pricing' }, { label: 'Join now' }, { label: 'Account' }]

  it('leaves navigation untouched without rules', () => {
    expect(extractHeaderActions(items, undefined)).toEqual({ items, actions: [] })
    expect(extractHeaderActions(items, [])).toEqual({ items, actions: [] })
  })

  it('routes items by position or label in rule order', () => {
    const result = extractHeaderActions(items, [
      { match: -2, as: 'button', mobile: 'button', color: 'secondary', size: 'lg' },
      { match: 'Account' },
    ])

    expect(result.items).toEqual([{ label: 'Classes' }, { label: 'Pricing' }])
    expect(result.actions).toEqual([
      {
        item: { label: 'Join now' },
        as: 'button',
        mobile: 'button',
        button: { color: 'secondary', variant: undefined, size: 'lg', class: undefined, icon: undefined },
      },
      expect.objectContaining({ item: { label: 'Account' }, as: 'navigation', mobile: 'menu' }),
    ])
  })

  it('ignores unmatched, out-of-range and duplicate rules', () => {
    const result = extractHeaderActions(items, [{ match: 'Missing' }, { match: 9 }, { match: 0 }, { match: -4 }])

    expect(result.actions.map(action => action.item.label)).toEqual(['Classes'])
    expect(result.items).toHaveLength(3)
  })
})
