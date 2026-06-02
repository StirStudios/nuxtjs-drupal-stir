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
    login: {
      title: 'Login',
      description: 'Sign in to continue.',
    },
    protectedPage: {
      title: 'Protected Access',
      description: 'Enter the page password to continue.',
    },
    register: {
      title: 'Create Account',
      description: 'Create your account to continue.',
    },
    passwordRequest: {
      title: 'Reset Password',
      description:
        'Enter your email or username to receive reset instructions.',
    },
    passwordReset: {
      title: 'Choose a New Password',
      description: 'Set a new password for your account.',
    },
  },
})
