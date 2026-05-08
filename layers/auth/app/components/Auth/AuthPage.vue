<script setup lang="ts">
const route = useRoute()
const appConfig = useAppConfig()

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

const pageStyle = computed(() =>
  pageBackgroundImage.value
    ? ({ backgroundImage: `url('${pageBackgroundImage.value}')` } as const)
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
