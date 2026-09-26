import type { AuthThemeConfig } from '../types/theme'
import { authChromeLayout, resolveAuthChrome, resolveAuthPageKey } from '../utils/authTheme'

// Auth pages choose their site chrome in stirTheme.auth. app.vue renders the
// layout, so set it on the route before render: none, the default layout
// without its footer, or the full default layout.
export default defineNuxtRouteMiddleware((to) => {
  const pageKey = resolveAuthPageKey(to)

  if (!pageKey) return

  const authTheme = ((useAppConfig().stirTheme || {}) as { auth?: AuthThemeConfig }).auth || {}
  const layout = authChromeLayout(resolveAuthChrome(authTheme, pageKey))

  // Runs the same way on the server and client, so the route meta agrees.
  to.meta.layout = layout.name === false ? false : 'default'
  to.meta.layoutProps = layout.props
})
