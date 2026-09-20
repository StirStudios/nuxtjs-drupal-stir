export default defineAppConfig({

  protectedRoutes: {
    requireLoginPaths: [],
    loginPath: '/auth/protected',
    allowAuthenticatedUserBypass: false,
    fallbackRedirectPath: '/',
  },

  authProfileForm: {
    booleanControl: 'checkbox',
    editorFields: [],
    fieldIcons: {},
  },
})
