export default defineAppConfig({
  ui: {},

  protectedRoutes: {
    requireLoginPaths: [],
    loginPath: '/auth/protected',
    allowAuthenticatedUserBypass: false,
    fallbackRedirectPath: '/',
  },

  authIntegration: {
    drupalAccounts: false,
  },
})
