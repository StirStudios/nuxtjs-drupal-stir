import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  privacyNotice: {
    enabled: false,
    mode: 'notice',
    position: 'center',
    dismissible: true,
    title: '',
    message: '',
    messageLinks: 'For more information please review our',
    termsUrl: '',
    privacyUrl: '',
    cookiePolicyUrl: '',
    cookieConsentUrl: '',
    links: [],
    legalLinks: [],
    buttonLabel: 'Got it',
    declineButtonLabel: 'Decline',
  },

  popup: {
    enabled: false,
    component: '',
  },
} as unknown as AppConfigInput)
