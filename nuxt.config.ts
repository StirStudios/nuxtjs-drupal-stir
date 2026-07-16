export default defineNuxtConfig({
  extends: [
    './layers/platform',
    './layers/editorial',
    './layers/analytics',
    './layers/scripts',
    './layers/webform',
    './layers/auth',
  ],
})
