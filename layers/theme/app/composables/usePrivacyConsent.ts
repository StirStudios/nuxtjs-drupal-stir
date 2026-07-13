export type PrivacyConsentMode = 'consent' | 'notice'
export type PrivacyConsentStatus =
  | 'accepted'
  | 'declined'
  | 'dismissed'
  | 'undecided'

export type PrivacyConsentConfig = {
  enabled?: boolean
  mode?: PrivacyConsentMode
}

export type PrivacyConsentCookieValue = boolean | string | null | undefined
export type PrivacyConsentWithdrawalOptions = {
  reload?: boolean
}

const COOKIE_NAME = 'cookie_consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function resolvePrivacyConsentStatus(
  value: PrivacyConsentCookieValue,
): PrivacyConsentStatus {
  if (value === true || value === 'true' || value === 'accepted') {
    return 'accepted'
  }

  if (value === 'declined' || value === 'false') return 'declined'
  if (value === 'dismissed') return 'dismissed'

  // Preserve legacy non-empty decisions without treating them as consent.
  if (typeof value === 'string' && value.trim()) return 'dismissed'

  return 'undecided'
}

export function allowsNonEssentialScripts(
  config: PrivacyConsentConfig | null | undefined,
  status: PrivacyConsentStatus,
): boolean {
  if (config?.enabled !== true || config.mode !== 'consent') return true

  return status === 'accepted'
}

export function usePrivacyConsent() {
  const appConfig = useAppConfig()
  const consentCookie = useCookie<boolean | string | null>(COOKIE_NAME, {
    maxAge: COOKIE_MAX_AGE,
  })
  const config = computed(() => appConfig.privacyNotice)
  const mode = computed<PrivacyConsentMode>(() =>
    config.value?.mode === 'consent' ? 'consent' : 'notice',
  )
  const status = computed(() =>
    resolvePrivacyConsentStatus(consentCookie.value),
  )
  const hasDecision = computed(() => status.value !== 'undecided')
  const allowsNonEssential = computed(() =>
    allowsNonEssentialScripts(config.value, status.value),
  )

  function setStatus(value: Exclude<PrivacyConsentStatus, 'undecided'>) {
    consentCookie.value = value
  }

  function accept() {
    setStatus('accepted')
  }

  function decline() {
    setStatus('declined')
  }

  function dismiss() {
    setStatus(mode.value === 'consent' ? 'declined' : 'dismissed')
  }

  function withdraw(options: PrivacyConsentWithdrawalOptions = {}) {
    setStatus('declined')

    // A reload is the only reliable way to tear down code already executed by
    // third-party widgets after consent is withdrawn.
    if (import.meta.client && options.reload !== false) {
      window.location.reload()
    }
  }

  return {
    accept,
    allowsNonEssential,
    consentCookie,
    decline,
    dismiss,
    hasDecision,
    mode,
    status,
    withdraw,
  }
}
