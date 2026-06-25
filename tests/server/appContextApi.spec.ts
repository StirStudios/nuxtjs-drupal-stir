import { describe, expect, it } from 'vitest'
import {
  appContextQuery,
  buildAppContextEndpoint,
} from '../../layers/core/server/utils/appContextApi'

describe('appContextApi', () => {
  it('builds the Drupal app context endpoint with route path context', () => {
    expect(appContextQuery('/contact')).toEqual({ path: '/contact' })
    expect(buildAppContextEndpoint('/contact')).toBe('/api/app-context?path=%2Fcontact')
  })

  it('keeps the app context route available without a path query', () => {
    expect(appContextQuery('')).toEqual({})
    expect(buildAppContextEndpoint('')).toBe('/api/app-context')
  })
})
