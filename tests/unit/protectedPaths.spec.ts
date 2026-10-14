import { describe, expect, it } from 'vitest'
import {
  canonicalizeStirProtectedPath,
  isStirProtectedPath,
} from '../../layers/auth/shared/utils/protectedPaths'

const RULES = ['/clients', '/clients/']

// Each of these reaches the same Drupal node as /clients/vendors, so the page
// middleware (which matches to.path) must treat it as protected.
const BYPASS_VARIANTS = [
  '/clients/vendors',
  '/Clients/vendors',
  '/CLIENTS/VENDORS',
  '/%43lients/vendors',
  '/%63lients/vendors',
  '/clients%2Fvendors',
  '/clients%2fvendors',
  '/clients./vendors',
  '/clients;x=1/vendors',
  '//clients/vendors',
  '/clients//vendors',
  '/./clients/vendors',
  '/other/../clients/vendors',
  '/ſclients'.replace('ſclients', 'clients/vendors'),
  '/clieKts/vendors'.replace('K', 'n'),
  '/ｃlients/vendors',
  '/Clients/vendors',
]

describe('protected path matching', () => {
  it.each(BYPASS_VARIANTS)('protects %s', (path) => {
    expect(isStirProtectedPath(path, RULES)).toBe(true)
  })

  it('folds Unicode case variants Drupal may treat as equal', () => {
    expect(isStirProtectedPath('/Keys', ['/keys'])).toBe(true)
    expect(isStirProtectedPath('/ſecret/doc', ['/secret/'])).toBe(true)
  })

  it('protects the exact path with a trailing slash or in another case', () => {
    expect(isStirProtectedPath('/Clients', ['/clients'])).toBe(true)
    expect(isStirProtectedPath('/clients/', ['/clients'])).toBe(true)
  })

  it('matches configured rules written in mixed case', () => {
    expect(isStirProtectedPath('/clients/vendors', ['/Clients/'])).toBe(true)
  })

  it('leaves unrelated paths unprotected', () => {
    expect(isStirProtectedPath('/clientship', RULES)).toBe(false)
    expect(isStirProtectedPath('/about', RULES)).toBe(false)
    expect(isStirProtectedPath('/clients-area', ['/clients/'])).toBe(false)
    expect(isStirProtectedPath('/', RULES)).toBe(false)
  })

  it('canonicalizes to a lowercase, decoded, dot-free path', () => {
    expect(canonicalizeStirProtectedPath('/A/./b/../%43;p/')).toBe('/a/c/')
    expect(canonicalizeStirProtectedPath('/%E0%A4%A')).toBe('/%e0%a4%a')
    expect(canonicalizeStirProtectedPath('/')).toBe('/')
  })
})
