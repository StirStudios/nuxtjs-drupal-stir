import { describe, expect, it } from 'vitest'
import {
  configBlock,
  evaluateServices,
  parseEnabledModules,
  plainText,
} from '../../scripts/compliance/discovery.mjs'

type Signals = Parameters<typeof evaluateServices>[0]

function signals(overrides: Partial<Signals> = {}): Signals {
  return {
    drupalConfig: true,
    modules: new Set<string>(),
    configNames: new Set<string>(),
    userRegistration: 'admin_only',
    appConfig: '',
    envNames: new Set<string>(),
    ...overrides,
  }
}

const brochureSignals = () => signals({
  modules: new Set(['webform', 'stir_turnstile', 'stir_bunny', 'symfony_mailer_lite']),
  configNames: new Set(['webform.webform.contact']),
  appConfig: 'analytics: { plausible: { enabled: true, domain: \'example.com\' } }',
})

const brochureConfig = {
  technology: {
    analytics: ['Plausible Analytics'],
    forms: ['Contact'],
    vendors: ['Cloudflare Turnstile', 'Bunny.net', 'Amazon SES email delivery'],
  },
  consent: { mode: 'not-required' },
}

const brochurePrivacy = 'Contact form submissions are kept for up to 24 months. We use Plausible, Cloudflare Turnstile, and Bunny.net.'

describe('compliance service discovery', () => {
  it('reads enabled modules from a core.extension export', () => {
    const modules = parseEnabledModules('_core:\n  default_config_hash: x\nmodule:\n  webform: 0\n  stir_bunny: 0\n  standard: 1000\ntheme:\n  gin: 0\n')

    expect([...modules]).toEqual(['webform', 'stir_bunny', 'standard'])
  })

  it('extracts nested app config blocks', () => {
    const source = 'privacyNotice: { enabled: true, links: [{ a: 1 }], mode: \'consent\' }, popup: { enabled: false }'

    expect(configBlock(source, 'privacyNotice')).toContain('mode: \'consent\'')
    expect(configBlock(source, 'privacyNotice')).not.toContain('popup')
  })

  it('reduces legal HTML to searchable text', () => {
    expect(plainText('<h2>Payments</h2><script>billing()</script><p>Refunds&nbsp;&amp; credits</p>')).toBe('Payments Refunds & credits')
  })

  it('passes a brochure site without holding it to account or billing rules', () => {
    const result = evaluateServices(brochureSignals(), brochureConfig, {
      privacy: brochurePrivacy,
      terms: 'Terms.',
      accessibility: 'Statement.',
    })

    expect(result.errors).toEqual([])
    expect(result.detected.map(line => line.split(':')[0])).toEqual([
      'Drupal Webforms',
      'Cloudflare Turnstile',
      'Plausible Analytics',
      'Bunny.net video',
      'Transactional email delivery',
    ])
  })

  it('reports an active service missing from the inventory and legal copy', () => {
    const result = evaluateServices(
      signals({ modules: new Set(['stir_instagram']) }),
      { technology: { vendors: [] }, consent: { mode: 'not-required' } },
      { privacy: 'No third parties.' },
    )

    expect(result.errors).toEqual([
      'Instagram feed is active (Drupal module stir_instagram) but not declared in technology.vendors.',
      'Instagram feed is active, but the privacy document does not cover Instagram.',
    ])
  })

  it('requires renewal and cancellation terms only when payments renew', () => {
    const subscription = signals({
      modules: new Set(['acme_stripe', 'role_expire']),
      userRegistration: 'visitors',
    })
    const config = {
      technology: { forms: ['Account registration'], vendors: ['Stripe'] },
      dataHandling: { checkoutConsentRecord: 'Stored on the Stripe subscription.' },
      consent: { mode: 'not-required' },
    }
    const privacy = 'Account data, deletion requests, and billing details.'

    expect(evaluateServices(subscription, config, { privacy, terms: 'Your account and payment terms.' }).errors).toEqual([
      'Automatically renewing plans is active, but the terms document does not cover automatic renewal.',
      'Automatically renewing plans is active, but the terms document does not cover how to cancel.',
    ])
    expect(evaluateServices(subscription, config, {
      privacy,
      terms: 'Your account and payment terms. Plans renew automatically until you cancel.',
    }).errors).toEqual([])
  })

  it('warns when legal copy is unavailable instead of guessing', () => {
    const result = evaluateServices(brochureSignals(), brochureConfig, {})

    expect(result.errors).toEqual([])
    expect(result.warnings).toContain('privacy disclosures were not verified; add compliance/legal/<alias>.html or publish the page at owner.domain.')
  })

  it('accepts a documented inactive service and rejects an undocumented one', () => {
    const active = signals({ modules: new Set(['stir_bunny']) })

    const documented = evaluateServices(active, { technology: { vendors: [], inactive: { bunny: 'Module kept for legacy media only.' } } }, {})

    expect(documented.errors).toEqual([])
    expect(documented.detected).toEqual(['Bunny.net video: inactive (Module kept for legacy media only.)'])

    expect(evaluateServices(active, { technology: { vendors: [], inactive: { bunny: '' } } }, {}).errors).toEqual([
      'technology.inactive.bunny must explain why Bunny.net video is not in use.',
    ])
  })

  it('flags declared vendors without repository evidence', () => {
    const result = evaluateServices(signals(), { technology: { vendors: ['Stripe'] } }, {})

    expect(result.warnings).toContain('Online payments is declared in technology.vendors, but no repository evidence was found; confirm it is still active.')
  })

  it('reconciles the consent inventory with the privacy notice mode', () => {
    const consentUi = signals({ appConfig: 'privacyNotice: { enabled: true, mode: \'consent\' }' })

    expect(evaluateServices(signals(), { consent: { mode: 'required' } }, {}).errors).toContain(
      'consent.mode is "required", but app.config privacyNotice is not enabled in consent mode.',
    )
    expect(evaluateServices(consentUi, { consent: { mode: 'not-required' } }, {}).warnings).toContain(
      'app.config privacyNotice asks for consent while consent.mode is "not-required"; reconcile the rationale.',
    )
  })
})
