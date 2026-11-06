
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
    ignoredPaths: [],
    ignoredPathPrefixes: [],
    mobilePresentation: 'card',
    buttonLabel: 'Got it',
    declineButtonLabel: 'Decline',
  },

  popup: {
    enabled: false,
    component: '',
    title: '',
    dismissalTtlDays: 14,
    hideWhenLoggedIn: false,
    mobilePresentation: 'modal',
  },
})
