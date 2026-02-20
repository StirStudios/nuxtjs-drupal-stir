import { defineNuxtRouteMiddleware, useColorMode, useAppConfig } from '#imports'

function matchesRoute(path: string, rule: string): boolean {
  const normalizedRule = rule.trim()

  if (!normalizedRule) return false
  if (normalizedRule === '/') return path === '/'
  return path === normalizedRule || path.startsWith(`${normalizedRule}/`)
}

export default defineNuxtRouteMiddleware((to) => {
  const colorMode = useColorMode()
  const {
    forced = false,
    preference = 'dark',
    showToggle = true,
    lightRoutes = [],
    darkRoutes = [],
  } = useAppConfig().colorMode

  if (forced) {
    colorMode.preference = preference
    to.meta.colorMode = preference
    return
  }

  const isLight = lightRoutes.some((prefix: string) => matchesRoute(to.path, prefix))
  const isDark = darkRoutes.some((prefix: string) => matchesRoute(to.path, prefix))

  // If toggle is hidden, keep baseline mode deterministic across app reloads
  // regardless of any previously persisted user choice.
  if (!showToggle) {
    colorMode.preference = preference
  }

  if (isLight) {
    to.meta.colorMode = 'light'
    return
  }

  if (isDark) {
    to.meta.colorMode = 'dark'
    return
  }

  if (!showToggle) {
    to.meta.colorMode = preference
    return
  }

  delete to.meta.colorMode
})
