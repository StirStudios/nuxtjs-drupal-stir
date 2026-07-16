export default defineNuxtConfig({
  extends: [
    './layers/platform',
    './layers/editorial',
    './layers/integrations',
    './layers/analytics',
    './layers/scripts',
    './layers/webform',
    './layers/auth',
  ],
})
