import { positiveIntegerEnvironment } from '../../config/runtime'

export default defineNuxtConfig({
  extends: ['../turnstile'],

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
      maxFields: positiveIntegerEnvironment(
        process.env.WEBFORM_MAX_FIELDS,
        100,
      ),
    },
  },
})
