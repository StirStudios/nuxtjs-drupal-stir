import { describe, expect, it } from 'vitest'
import {
  resolveAuthCardConfig,
  resolveAuthPageKey,
} from '../../layers/auth/app/utils/authTheme'

describe('auth theme utilities', () => {
  it('prefers an explicit auth page key for custom downstream routes', () => {
    expect(resolveAuthPageKey({
      meta: { authPageKey: 'passwordReset' },
      name: 'custom-account-recovery',
      path: '/account/recovery',
    })).toBe('passwordReset')
  })

  it('resolves auth pages from route names and paths', () => {
    expect(resolveAuthPageKey({
      meta: {},
      name: 'layer-auth-password-request',
      path: '/custom',
    })).toBe('passwordRequest')
    expect(resolveAuthPageKey({
      meta: {},
      name: undefined,
      path: '/prefix/auth/verify',
    })).toBe('verify')
  })

  it('deep-merges global and per-page card UI settings', () => {
    expect(resolveAuthCardConfig({
      card: {
        class: 'shadow-none',
        ui: {
          container: 'p-8',
          footer: 'text-start',
        },
      },
      pages: {
        login: {
          card: {
            ui: {
              footer: 'text-center',
            },
          },
        },
      },
    }, 'login')).toEqual({
      class: 'shadow-none',
      ui: {
        container: 'p-8',
        footer: 'text-center',
      },
    })
  })
})
