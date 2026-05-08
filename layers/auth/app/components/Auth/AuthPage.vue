<script setup lang="ts">
const route = useRoute()
const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()

type AuthPageConfigKey =
  | 'login'
  | 'protectedPage'
  | 'register'
  | 'passwordRequest'
  | 'passwordReset'

const resolveAuthPageKey = (): AuthPageConfigKey | null => {
  const explicitKey = route.meta.authPageKey

  if (typeof explicitKey === 'string' && explicitKey.trim()) {
    switch (explicitKey) {
      case 'login':
      case 'protectedPage':
      case 'register':
      case 'passwordRequest':
      case 'passwordReset':
        return explicitKey
      default:
        break
    }
  }

  const routeName = typeof route.name === 'string' ? route.name : ''

  if (routeName.includes('auth-login')) return 'login'
  if (routeName.includes('auth-protected')) return 'protectedPage'
  if (routeName.includes('auth-register')) return 'register'
  if (routeName.includes('auth-password-request')) return 'passwordRequest'
  if (routeName.includes('auth-password-reset')) return 'passwordReset'

  const path = route.path

  if (path.endsWith('/auth/login')) return 'login'
  if (path.endsWith('/auth/protected')) return 'protectedPage'
  if (path.endsWith('/auth/register')) return 'register'
  if (path.endsWith('/auth/password/request')) return 'passwordRequest'
  if (path.endsWith('/auth/password/reset')) return 'passwordReset'

  return null
}

const pageBackgroundImage = computed(() => {
  const auth = appConfig.auth || {}
  const pageKey = resolveAuthPageKey()
  const pageConfig = pageKey ? auth[pageKey] : undefined

  const pageImage =
    typeof pageConfig?.backgroundImage === 'string'
      ? pageConfig.backgroundImage.trim()
      : ''

  if (pageImage) {
    return pageImage
  }

  return typeof auth.backgroundImage === 'string'
    ? auth.backgroundImage.trim()
    : ''
})

const resolvedBackgroundImage = computed(() => {
  const image = pageBackgroundImage.value

  if (!image) {
    return ''
  }

  if (!image.startsWith('/')) {
    return image
  }

  const apiBase =
    typeof runtimeConfig.public?.api === 'string'
      ? runtimeConfig.public.api.trim().replace(/\/$/, '')
      : ''

  return apiBase ? `${apiBase}${image}` : image
})

const pageStyle = computed(() =>
  resolvedBackgroundImage.value
    ? ({ backgroundImage: `url('${resolvedBackgroundImage.value}')` } as const)
    : undefined,
)
</script>

<template>
  <div
    class="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 text-center"
    role="presentation"
    :style="pageStyle"
  >
    <main class="w-full max-w-md" role="main">
      <slot />
    </main>
  </div>
</template>
