import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

// Tracked legal copy lives in the Nuxt repository or its Drupal parent.
export const LEGAL_SOURCE_DIRECTORIES = ['compliance/legal', '../compliance/legal']

async function readText(path) {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return ''
  }
}

export function parseEnabledModules(coreExtension) {
  const block = coreExtension.match(/^module:[ \t]*\n((?:[ \t]+\S.*(?:\n|$))*)/m)?.[1] ?? ''
  return new Set([...block.matchAll(/^[ \t]+([a-z0-9_]+):/gm)].map(match => match[1]))
}

/**
 * Returns the body of the first `key: { ... }` object in a config source.
 */
export function configBlock(source, key) {
  const match = new RegExp(`\\b${key}\\s*:\\s*\\{`).exec(source)
  if (!match) return ''

  let depth = 0
  for (let index = match.index + match[0].length - 1; index < source.length; index++) {
    if (source[index] === '{') depth++
    else if (source[index] === '}' && --depth === 0) {
      return source.slice(match.index + match[0].length, index)
    }
  }
  return ''
}

const isEnabled = block => /\benabled\s*:\s*true\b/.test(block)

export function plainText(html) {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function collectSignals(projectRoot, drupalConfigDirectory) {
  const signals = {
    drupalConfig: Boolean(drupalConfigDirectory),
    modules: new Set(),
    configNames: new Set(),
    userRegistration: '',
    appConfig: await readText(resolve(projectRoot, 'app/app.config.ts')),
    envNames: new Set(),
  }

  // Only variable names are read; values never leave the environment file.
  for (const file of ['.env.example', '.env']) {
    for (const match of (await readText(resolve(projectRoot, file))).matchAll(/^([A-Z][A-Z0-9_]*)=/gm)) {
      signals.envNames.add(match[1])
    }
  }

  if (drupalConfigDirectory) {
    signals.modules = parseEnabledModules(await readText(resolve(drupalConfigDirectory, 'core.extension.yml')))
    try {
      signals.configNames = new Set(
        (await readdir(drupalConfigDirectory))
          .filter(name => name.endsWith('.yml'))
          .map(name => name.slice(0, -4)),
      )
    } catch {
      // An unreadable export leaves config-name evidence empty.
    }
    signals.userRegistration = (await readText(resolve(drupalConfigDirectory, 'user.settings.yml')))
      .match(/^register:\s*['"]?([a-z_]+)/m)?.[1] ?? ''
  }

  return signals
}

export async function loadLegalText(projectRoot, documents = {}) {
  const text = {}
  const sources = {}

  for (const [key, document] of Object.entries(documents)) {
    const alias = document?.path?.replace(/^\/+|\/+$/g, '')
    const candidates = document?.file
      ? [document.file]
      : alias
        ? LEGAL_SOURCE_DIRECTORIES.map(directory => `${directory}/${alias}.html`)
        : []

    for (const candidate of candidates) {
      const html = await readText(resolve(projectRoot, candidate))
      if (!html) continue
      text[key] = plainText(html)
      sources[key] = candidate
      break
    }
  }

  return { text, sources }
}

const modules = (signals, pattern) =>
  [...signals.modules].filter(name => pattern.test(name)).map(name => `Drupal module ${name}`)
const configs = (signals, pattern) =>
  [...signals.configNames].filter(name => pattern.test(name)).map(name => `Drupal config ${name}`)
const enabledInAppConfig = (signals, key) =>
  isEnabled(configBlock(signals.appConfig, key)) ? [`app.config ${key}.enabled`] : []

const detectPayments = signals =>
  modules(signals, /stripe|paypal|braintree|square|^commerce_(?:payment|checkout)$/)

/**
 * Services the audit can recognize from repository evidence.
 *
 * `inventory` names the compliance/site.json field that must declare an active
 * service; `disclosures` names wording the tracked or rendered legal copy must
 * contain. A rule applies only when its evidence is found, so a brochure site
 * is never held to subscription or account requirements.
 */
export const SERVICE_RULES = [
  {
    id: 'webforms',
    label: 'Drupal Webforms',
    detect: signals => (signals.modules.has('webform') ? configs(signals, /^webform\.webform\./) : []),
    disclosures: [
      { document: 'privacy', label: 'information collected through forms', pattern: /\bforms?\b|submission|inquir/i },
      {
        document: 'privacy',
        label: 'how long submissions are kept',
        pattern: /retain|retention|stored for|up to \d+ (?:days|weeks|months|years)/i,
      },
    ],
  },
  {
    id: 'turnstile',
    label: 'Cloudflare Turnstile',
    detect: signals => modules(signals, /^stir_turnstile$/),
    inventory: { path: 'technology.vendors', pattern: /turnstile/i },
    disclosures: [{ document: 'privacy', label: 'Cloudflare Turnstile', pattern: /turnstile/i }],
  },
  {
    id: 'plausible',
    label: 'Plausible Analytics',
    detect: (signals) => {
      const block = configBlock(signals.appConfig, 'plausible')
      if (/\bdomain\s*:\s*['"][^'"]+['"]/.test(block) && !/\benabled\s*:\s*false\b/.test(block)) {
        return ['app.config analytics.plausible.domain']
      }
      return signals.envNames.has('NUXT_PUBLIC_PLAUSIBLE_DOMAIN') ? ['environment NUXT_PUBLIC_PLAUSIBLE_DOMAIN'] : []
    },
    inventory: { path: 'technology.analytics', pattern: /plausible/i },
    disclosures: [{ document: 'privacy', label: 'Plausible Analytics', pattern: /plausible/i }],
  },
  {
    id: 'bunny',
    label: 'Bunny.net video',
    detect: signals => modules(signals, /^stir_bunny$/),
    inventory: { path: 'technology.vendors', pattern: /bunny/i },
    disclosures: [{ document: 'privacy', label: 'Bunny.net video delivery', pattern: /bunny/i }],
  },
  {
    id: 'email',
    label: 'Transactional email delivery',
    detect: signals => modules(signals, /^(?:symfony_mailer(?:_lite)?|smtp|amazon_ses|mailgun|sendgrid_integration|postmark)$/),
    inventory: { path: 'technology.vendors', pattern: /e-?mail|\bses\b|smtp|mailgun|sendgrid|postmark/i, reverse: false },
  },
  {
    id: 'remote-video',
    label: 'Third-party video embeds',
    detect: signals => configs(signals, /^media\.type\.remote_video$/),
    disclosures: [
      {
        document: 'privacy',
        label: 'third-party media providers',
        pattern: /youtube|vimeo|third[- ]party (?:media|video|content|platforms?)/i,
      },
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram feed',
    detect: signals => modules(signals, /^stir_instagram$/),
    inventory: { path: 'technology.vendors', pattern: /instagram|\bmeta\b/i },
    disclosures: [{ document: 'privacy', label: 'Instagram', pattern: /instagram/i }],
  },
  {
    id: 'accounts',
    label: 'Public user accounts',
    detect: signals =>
      signals.userRegistration && signals.userRegistration !== 'admin_only'
        ? [`Drupal user.settings register: ${signals.userRegistration}`]
        : [],
    inventory: { path: 'technology.forms', pattern: /account|regist|profile|sign[- ]?up/i },
    disclosures: [
      { document: 'privacy', label: 'account information', pattern: /\baccounts?\b/i },
      { document: 'privacy', label: 'account deletion requests', pattern: /delet/i },
      { document: 'terms', label: 'account responsibilities', pattern: /\baccounts?\b/i },
    ],
  },
  {
    id: 'payments',
    label: 'Online payments',
    detect: detectPayments,
    inventory: { path: 'technology.vendors', pattern: /stripe|paypal|braintree|square|payment/i },
    disclosures: [
      { document: 'privacy', label: 'payment and billing information', pattern: /payment|billing/i },
      { document: 'terms', label: 'payment, billing, or refund terms', pattern: /payment|billing|refund/i },
    ],
  },
  {
    id: 'recurring-billing',
    label: 'Automatically renewing plans',
    detect: (signals) => {
      const payments = detectPayments(signals)
      const recurring = [
        ...modules(signals, /^(?:role_expire|commerce_recurring|recurly|chargebee)$|subscription/),
        ...configs(signals, /subscription/),
      ]
      return payments.length && recurring.length ? [...payments, ...recurring] : []
    },
    inventory: { path: 'dataHandling.checkoutConsentRecord', pattern: /\S/ },
    disclosures: [
      {
        document: 'terms',
        label: 'automatic renewal',
        pattern: /automatic(?:ally)?[- ]renew|auto[- ]renew|renews? automatically/i,
      },
      { document: 'terms', label: 'how to cancel', pattern: /cancel/i },
    ],
  },
  {
    id: 'newsletter',
    label: 'Newsletter or marketing email',
    detect: signals => [
      ...modules(signals, /^(?:simplenews|mailchimp|sendy|constant_contact|klaviyo|hubspot)/),
      ...configs(signals, /^field\.storage\.user\.field_(?:sendy|newsletter|mailchimp)$|newsletter/),
    ],
    inventory: {
      path: 'technology.vendors',
      pattern: /sendy|mailchimp|simplenews|klaviyo|hubspot|constant contact|newsletter/i,
    },
    disclosures: [
      { document: 'privacy', label: 'newsletter sign-up and unsubscribing', pattern: /newsletter|unsubscribe|marketing e-?mail/i },
    ],
  },
  {
    id: 'saved-activity',
    label: 'Saved content or activity history',
    detect: signals => modules(signals, /^(?:flag|stir_account_tracker)$|favorites$/),
    disclosures: [
      {
        document: 'privacy',
        label: 'saved items or activity history',
        pattern: /favorite|saved|bookmark|progress|history|activity/i,
      },
    ],
  },
  {
    id: 'privacy-notice',
    label: 'Privacy notice banner',
    detect: signals => enabledInAppConfig(signals, 'privacyNotice'),
    inventory: { path: 'technology.browserStorage', pattern: /notice|dismiss|consent/i, reverse: false },
  },
  {
    id: 'userway',
    label: 'UserWay accessibility widget',
    detect: signals => enabledInAppConfig(signals, 'userway'),
    inventory: { path: 'technology.vendors', pattern: /userway/i },
    disclosures: [{ document: 'accessibility', label: 'the UserWay widget', pattern: /userway|overlay|widget/i }],
  },
  {
    id: 'enzuzo',
    label: 'Enzuzo policy embed',
    detect: signals => modules(signals, /^stir_layout_builder_paragraph_enzuzo$/),
    advice: 'the paragraph type is still installed; confirm no content uses it, then uninstall it.',
  },
]

function textAt(config, path) {
  const value = path.split('.').reduce((node, key) => node?.[key], config)
  if (Array.isArray(value)) return value.join('\n')
  return typeof value === 'string' ? value : ''
}

export function evaluateServices(signals, config, legalText = {}) {
  const errors = []
  const warnings = []
  const detected = []
  const unverified = new Set()
  const inactive = config?.technology?.inactive ?? {}
  const ruleIds = new Set(SERVICE_RULES.map(rule => rule.id))

  for (const id of Object.keys(inactive)) {
    if (!ruleIds.has(id)) warnings.push(`technology.inactive.${id} does not match a discoverable service.`)
  }

  for (const rule of SERVICE_RULES) {
    const evidence = rule.detect(signals)
    const declared = rule.inventory ? rule.inventory.pattern.test(textAt(config, rule.inventory.path)) : false

    if (!evidence.length) {
      if (declared && rule.inventory.reverse !== false && !(rule.id in inactive)) {
        warnings.push(`${rule.label} is declared in ${rule.inventory.path}, but no repository evidence was found; confirm it is still active.`)
      }
      continue
    }

    if (rule.id in inactive) {
      const reason = typeof inactive[rule.id] === 'string' ? inactive[rule.id].trim() : ''
      if (!reason) errors.push(`technology.inactive.${rule.id} must explain why ${rule.label} is not in use.`)
      else detected.push(`${rule.label}: inactive (${reason})`)
      continue
    }

    detected.push(`${rule.label}: ${evidence.join(', ')}`)
    if (rule.advice) warnings.push(`${rule.label}: ${rule.advice}`)
    if (rule.inventory && !declared) {
      errors.push(`${rule.label} is active (${evidence[0]}) but not declared in ${rule.inventory.path}.`)
    }

    for (const disclosure of rule.disclosures ?? []) {
      const text = legalText[disclosure.document]
      if (typeof text !== 'string') {
        unverified.add(disclosure.document)
        continue
      }
      if (!disclosure.pattern.test(text)) {
        errors.push(`${rule.label} is active, but the ${disclosure.document} document does not cover ${disclosure.label}.`)
      }
    }
  }

  const notice = configBlock(signals.appConfig, 'privacyNotice')
  const consentPrompt = isEnabled(notice) && /\bmode\s*:\s*['"]consent['"]/.test(notice)
  if (config?.consent?.mode === 'required' && !consentPrompt) {
    errors.push('consent.mode is "required", but app.config privacyNotice is not enabled in consent mode.')
  }
  if (config?.consent?.mode === 'not-required' && consentPrompt) {
    warnings.push('app.config privacyNotice asks for consent while consent.mode is "not-required"; reconcile the rationale.')
  }

  for (const document of unverified) {
    warnings.push(`${document} disclosures were not verified; add compliance/legal/<alias>.html or publish the page at owner.domain.`)
  }

  return { errors, warnings, detected }
}
