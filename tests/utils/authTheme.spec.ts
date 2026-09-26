import { describe, expect, it } from 'vitest'
import {
  authChromeLayout,
  resolveAuthCardConfig,
  hasConfiguredSecondaryAction,
  resolveAuthChrome,
  resolveAuthTitleClass,
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

  it('resolves auth chrome from the page, then the auth theme, then none', () => {
    const theme = {
      chrome: 'full' as const,
      pages: { protectedPage: { chrome: 'header' as const }, login: {} },
    }

    expect(resolveAuthChrome(theme, 'protectedPage')).toBe('header')
    expect(resolveAuthChrome(theme, 'login')).toBe('full')
    expect(resolveAuthChrome(theme, null)).toBe('full')
    expect(resolveAuthChrome({}, 'login')).toBe('none')
    expect(resolveAuthChrome({ chrome: 'sideways' } as never, 'login')).toBe('none')
  })

  it('uses the configured auth title class, else the standard title look', () => {
    expect(resolveAuthTitleClass({ titleClass: ' font-heading text-4xl ' })).toBe('font-heading text-4xl')
    expect(resolveAuthTitleClass({})).toBe('mb-0 text-xl leading-7 font-semibold')
    expect(resolveAuthTitleClass(undefined)).toBe('mb-0 text-xl leading-7 font-semibold')
  })

  it('shows a secondary action on a page without a default link only when fully configured', () => {
    const enquiry = { label: 'Click here to inquire for more information', to: '/inquire' }

    expect(hasConfiguredSecondaryAction({}, 'protectedPage')).toBe(false)
    // Global styling for the other pages' back links doesn't add one to the gate.
    expect(hasConfiguredSecondaryAction({ secondaryAction: { variant: 'ghost' } }, 'protectedPage')).toBe(false)
    expect(hasConfiguredSecondaryAction({ pages: { protectedPage: { secondaryAction: enquiry } } }, 'protectedPage')).toBe(true)
    expect(hasConfiguredSecondaryAction({ secondaryAction: enquiry }, 'protectedPage')).toBe(true)
    expect(hasConfiguredSecondaryAction({
      secondaryAction: enquiry,
      pages: { protectedPage: { secondaryAction: { enabled: false } } },
    }, 'protectedPage')).toBe(false)
  })

  it('maps auth chrome to the layout app.vue renders', () => {
    expect(authChromeLayout('none')).toEqual({ name: false })
    expect(authChromeLayout('header')).toEqual({ name: 'default', props: { footer: false } })
    expect(authChromeLayout('full')).toEqual({ name: 'default', props: { footer: true } })
  })
})
