export default defineAppConfig({
  protectedRoutes: {
    requireLoginPaths: [],
    loginPath: '/auth/protected',
    allowAuthenticatedUserBypass: false,
  },

  auth: {
    accountEnabled: true,
    loginRedirectPath: '/',
    logoutRedirectPath: '/auth/login',
    protectedFallbackRedirectPath: '/',
    backgroundImage: '',
    backButton: {
      enabled: false,
      label: 'Back',
      to: '/',
      icon: 'i-lucide-arrow-left',
      color: 'neutral',
      variant: 'ghost',
      class: 'fixed bottom-4 left-4 z-50 shadow-md',
    },
    layout: 'card',
    imagePosition: 'left',
    showIcon: true,
    submitButton: {
      class: '',
      size: 'xl',
      variant: 'solid',
    },
  },
})
