import { fileURLToPath } from 'node:url'
import { positiveIntegerEnvironment } from '../../config/runtime'

const resolveWebformPath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url))

export default defineNuxtConfig({
  extends: ['../platform', '../turnstile'],

  alias: {
    '#stir-webform/utils': resolveWebformPath('./app/utils'),
    '#stir-webform/composables': resolveWebformPath('./app/composables'),
  },

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
