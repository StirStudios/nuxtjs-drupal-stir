import { positiveIntegerEnvironment } from '../../config/runtime'

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
    webformSubmissionLimits: {
      maxRequestBytes: positiveIntegerEnvironment(
        process.env.WEBFORM_MAX_REQUEST_BYTES,
        10 * 1024 * 1024,
      ),
      maxFileBytes: positiveIntegerEnvironment(
        process.env.WEBFORM_MAX_FILE_BYTES,
        5 * 1024 * 1024,
      ),
      maxFiles: positiveIntegerEnvironment(process.env.WEBFORM_MAX_FILES, 5),
      maxFields: positiveIntegerEnvironment(process.env.WEBFORM_MAX_FIELDS, 100),
    },
    turnstile: {
      secretKey: process.env.TURNSTILE_SECRET,
    },
  },
})
