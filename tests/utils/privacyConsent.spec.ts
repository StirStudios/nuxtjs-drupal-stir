import { describe, expect, it } from 'vitest'
import {
  allowsNonEssentialScripts,
  resolvePrivacyConsentStatus,
} from '../../layers/theme/app/composables/usePrivacyConsent'

describe('privacy consent', () => {
  it('preserves accepted legacy cookie values', () => {
    expect(resolvePrivacyConsentStatus(true)).toBe('accepted')
    expect(resolvePrivacyConsentStatus('true')).toBe('accepted')
    expect(resolvePrivacyConsentStatus('accepted')).toBe('accepted')
  })

  it('preserves prior decisions without granting unknown values consent', () => {
    expect(resolvePrivacyConsentStatus('declined')).toBe('declined')
    expect(resolvePrivacyConsentStatus('dismissed')).toBe('dismissed')
    expect(resolvePrivacyConsentStatus('legacy-value')).toBe('dismissed')
    expect(resolvePrivacyConsentStatus(false)).toBe('undecided')
    expect(resolvePrivacyConsentStatus(undefined)).toBe('undecided')
  })

  it('requires explicit acceptance only in enabled consent mode', () => {
    const consentConfig = { enabled: true, mode: 'consent' } as const

    expect(allowsNonEssentialScripts(consentConfig, 'undecided')).toBe(false)
    expect(allowsNonEssentialScripts(consentConfig, 'declined')).toBe(false)
    expect(allowsNonEssentialScripts(consentConfig, 'dismissed')).toBe(false)
    expect(allowsNonEssentialScripts(consentConfig, 'accepted')).toBe(true)
  })

  it('preserves script behavior in notice and disabled modes', () => {
    expect(
      allowsNonEssentialScripts({ enabled: true, mode: 'notice' }, 'undecided'),
    ).toBe(true)
    expect(
      allowsNonEssentialScripts({ enabled: false, mode: 'consent' }, 'declined'),
    ).toBe(true)
    expect(allowsNonEssentialScripts(undefined, 'undecided')).toBe(true)
  })
})
