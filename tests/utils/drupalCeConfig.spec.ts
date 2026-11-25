import { describe, expect, it } from 'vitest'
import { resolveDrupalCeConfig } from '../../layers/foundation/shared/utils/drupalCeConfig'

describe('resolveDrupalCeConfig', () => {
  it('fills defaults when the layer declares no settings', () => {
    expect(resolveDrupalCeConfig({})).toEqual({
      drupalBaseUrl: '',
      serverDrupalBaseUrl: '',
      ceApiEndpoint: '/ce-api',
      menuBaseUrl: '',
      menuEndpoint: 'api/menu_items/$$$NAME$$$',
      useLocalizedMenuEndpoint: true,
    })
  })

  it('normalises URLs and the endpoint', () => {
    expect(resolveDrupalCeConfig({
      drupalCe: {
        drupalBaseUrl: ' https://cms.example.com/ ',
        serverDrupalBaseUrl: 'http://drupal.internal//',
        ceApiEndpoint: 'ce-api/',
        menuBaseUrl: 'https://cms.example.com/',
        menuEndpoint: 'menus/$$$NAME$$$',
        useLocalizedMenuEndpoint: false,
      },
    })).toEqual({
      drupalBaseUrl: 'https://cms.example.com',
      serverDrupalBaseUrl: 'http://drupal.internal',
      ceApiEndpoint: '/ce-api',
      menuBaseUrl: 'https://cms.example.com',
      menuEndpoint: 'menus/$$$NAME$$$',
      useLocalizedMenuEndpoint: false,
    })
  })

  it('falls back on blank or wrongly typed overrides', () => {
    const config = resolveDrupalCeConfig({
      drupalCe: { ceApiEndpoint: '//', menuEndpoint: ' ', drupalBaseUrl: 42 },
    })

    expect(config.ceApiEndpoint).toBe('/ce-api')
    expect(config.menuEndpoint).toBe('api/menu_items/$$$NAME$$$')
    expect(config.drupalBaseUrl).toBe('')
  })
})
