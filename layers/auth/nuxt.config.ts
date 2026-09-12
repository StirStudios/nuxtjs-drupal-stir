import { resolve as resolvePath } from 'node:path'
import { createJiti } from 'jiti'
import { findPath, useNuxt } from '@nuxt/kit'
import { positiveIntegerEnvironment } from '../../config/runtime'

const loadModule = createJiti(import.meta.url, {
  interopDefault: false,
  moduleCache: false,
})

type ProtectedRoutesAppConfig = {
  protectedRoutes?: {
    requireLoginPaths?: unknown
    allowAuthenticatedUserBypass?: unknown
  }
}

export default defineNuxtConfig({
  extends: ['../turnstile'],

  modules: ['@nuxt/image'],

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
    // Mirrored from app config at build time so the server boundary can gate
    // protected content. Nitro cannot read app config at runtime, and a second
    // authoring surface would let the two drift apart, leaving a security
    // control that silently does not apply.
    stirProtectedRoutes: {
      requireLoginPaths: [] as string[],
      allowAuthenticatedUserBypass: false,
    },
  },

  hooks: {
    async 'modules:done'() {
      const nuxt = useNuxt()
      const appConfigPath = await findPath(
        resolvePath(nuxt.options.srcDir, 'app.config'),
      )

      if (!appConfigPath) return

      const globals = globalThis as typeof globalThis & {
        defineAppConfig?: (config: unknown) => unknown
      }
      const previousDefineAppConfig = globals.defineAppConfig

      globals.defineAppConfig = config => config

      let appConfig: ProtectedRoutesAppConfig

      try {
        const loaded = await loadModule.import<{
          default?: ProtectedRoutesAppConfig
        }>(appConfigPath)

        appConfig = loaded.default || {}
      } finally {
        if (previousDefineAppConfig) {
          globals.defineAppConfig = previousDefineAppConfig
        } else {
          delete globals.defineAppConfig
        }
      }

      const protectedRoutes = appConfig.protectedRoutes

      if (!protectedRoutes) return

      const runtimeConfig = nuxt.options.runtimeConfig as Record<string, unknown>

      runtimeConfig.stirProtectedRoutes = {
        requireLoginPaths: (Array.isArray(protectedRoutes.requireLoginPaths)
          ? protectedRoutes.requireLoginPaths
          : []
        ).filter(
          (path): path is string =>
            typeof path === 'string' && path.trim().length > 0,
        ),
        allowAuthenticatedUserBypass:
          protectedRoutes.allowAuthenticatedUserBypass !== false,
      }
    },
  },
})
