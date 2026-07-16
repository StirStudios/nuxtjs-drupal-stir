import { positiveIntegerEnvironment } from '../../config/runtime'

export default defineNuxtConfig({
  extends: ['../turnstile'],

  runtimeConfig: {
    protectedPassword: process.env.PROTECTED_PASSWORD || '',
    protectedRateLimit: {
      enabled: process.env.PROTECTED_RATE_LIMIT_ENABLED !== 'false',
      maxAttempts: positiveIntegerEnvironment(
        process.env.PROTECTED_RATE_LIMIT_MAX_ATTEMPTS,
        5,
      ),
      windowSeconds: positiveIntegerEnvironment(
        process.env.PROTECTED_RATE_LIMIT_WINDOW_SECONDS,
        15 * 60,
      ),
      trustProxy: process.env.PROTECTED_RATE_LIMIT_TRUST_PROXY === 'true',
    },
  },
})
