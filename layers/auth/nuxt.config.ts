import { createJiti } from 'jiti'
import { useNuxt } from '@nuxt/kit'
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
    // 'app:resolve' fires after Nuxt has collected every layer's app.config
    // path onto app.configs (project root first, most-extended layer last).
    // Reading only the project's own srcDir file here would silently drop
    // protectedRoutes defined by an extended layer instead of the project.
    async 'app:resolve'(app) {
      const nuxt = useNuxt()
      const globals = globalThis as typeof globalThis & {
        defineAppConfig?: (config: unknown) => unknown
      }
      const previousDefineAppConfig = globals.defineAppConfig

      globals.defineAppConfig = config => config

      let protectedRouteSources: NonNullable<ProtectedRoutesAppConfig['protectedRoutes']>[]

      try {
        const loaded = await Promise.all(
          app.configs.map(appConfigPath =>
            loadModule.import<{ default?: ProtectedRoutesAppConfig }>(appConfigPath),
          ),
        )

        protectedRouteSources = loaded
          .map(module => module.default?.protectedRoutes)
          .filter((routes): routes is NonNullable<ProtectedRoutesAppConfig['protectedRoutes']> => Boolean(routes))
      } finally {
        if (previousDefineAppConfig) {
          globals.defineAppConfig = previousDefineAppConfig
        } else {
          delete globals.defineAppConfig
        }
      }

      const inlineProtectedRoutes = (nuxt.options.appConfig as ProtectedRoutesAppConfig | undefined)
        ?.protectedRoutes

      if (inlineProtectedRoutes) protectedRouteSources.push(inlineProtectedRoutes)

      if (protectedRouteSources.length === 0) return

      const requireLoginPaths = [...new Set(
        protectedRouteSources.flatMap(routes =>
          Array.isArray(routes.requireLoginPaths) ? routes.requireLoginPaths : [],
        ),
      )].filter(
        (path): path is string =>
          typeof path === 'string' && path.trim().length > 0,
      )
      const allowAuthenticatedUserBypassSource = protectedRouteSources.find(
        routes => typeof routes.allowAuthenticatedUserBypass !== 'undefined',
      )

      const runtimeConfig = nuxt.options.runtimeConfig as Record<string, unknown>

      runtimeConfig.stirProtectedRoutes = {
        requireLoginPaths,
        allowAuthenticatedUserBypass:
          allowAuthenticatedUserBypassSource?.allowAuthenticatedUserBypass !== false,
      }
    },
  },
})
