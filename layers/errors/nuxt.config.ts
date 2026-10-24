export default defineNuxtConfig({
  // Consent for browser reports comes from the integrations layer.
  extends: ['../integrations'],

  runtimeConfig: {
    public: {
      errors: {
        // The site's GlitchTip (Sentry-compatible) address, kept in the
        // site's .env: https://<key>@errors.example.com/<project id>. Empty
        // means nothing is reported and nothing is downloaded.
        dsn: '',
        environment: process.env.NUXT_ENV || '',
        release: '',
      },
    },
  },
})
