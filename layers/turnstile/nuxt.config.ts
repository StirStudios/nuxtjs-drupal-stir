const turnstileSiteKey = process.env.TURNSTILE_KEY || ''

export default defineNuxtConfig({
  modules: [
    [
      '@nuxtjs/turnstile',
      {
        siteKey: turnstileSiteKey,
      },
    ],
  ],

  runtimeConfig: {
    turnstile: {
      secretKey: process.env.TURNSTILE_SECRET,
    },
  },
})
