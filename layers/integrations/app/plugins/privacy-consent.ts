export default defineNuxtPlugin(() => ({
  provide: {
    stirScriptConsent: usePrivacyConsent(),
  },
}))
