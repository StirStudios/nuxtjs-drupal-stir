<script setup lang="ts">
const route = useRoute()
const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()

const pageBackgroundImage = computed(() => {
  const auth = appConfig.auth || {}
  const path = route.path
  const pageConfig =
    path === '/auth/login'
      ? auth.login
      : path === '/auth/protected'
        ? auth.protectedPage
        : path === '/auth/register'
          ? auth.register
          : path === '/auth/password/request'
            ? auth.passwordRequest
            : path === '/auth/password/reset'
              ? auth.passwordReset
              : undefined

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
