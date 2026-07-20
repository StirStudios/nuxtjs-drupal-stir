import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  ui: {} as unknown as NonNullable<AppConfigInput['ui']>,

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
