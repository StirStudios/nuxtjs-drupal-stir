<script setup lang="ts">
import {
  authLayoutContextKey,
  defaultAuthImagePosition,
  defaultAuthLayout,
  resolveAuthImagePosition,
  resolveAuthLayout,
  type AuthImagePosition,
  type AuthLayout,
} from '../../utils/authLayout'

const route = useRoute()
const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()

const authConfig = appConfig.auth || {}

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

const resolveAuthPageConfig = (pageKey: AuthPageConfigKey | null): Record<string, unknown> | undefined => {
  if (!pageKey) return undefined
  const pageConfig = (authConfig as Record<string, unknown>)?.[pageKey]

  return typeof pageConfig === 'object' && pageConfig !== null ? (pageConfig as Record<string, unknown>) : undefined
}

const authPageConfig = computed(() => resolveAuthPageConfig(resolveAuthPageKey()))

const pageLayout = computed<AuthLayout>(() =>
  resolveAuthLayout(authPageConfig.value?.layout) ||
  resolveAuthLayout(authConfig.layout) ||
  defaultAuthLayout,
)

const imagePosition = computed<AuthImagePosition>(() =>
  resolveAuthImagePosition(authPageConfig.value?.imagePosition) ||
  resolveAuthImagePosition(authConfig.imagePosition) ||
  defaultAuthImagePosition,
)

const showIcon = computed(() => {
  if (typeof authPageConfig.value?.showIcon === 'boolean') {
    return authPageConfig.value.showIcon
  }

  return typeof authConfig.showIcon === 'boolean' ? authConfig.showIcon : true
})

const pageBackgroundImage = computed(() => {
  const pageImage = typeof authPageConfig.value?.backgroundImage === 'string'
    ? authPageConfig.value.backgroundImage.trim()
    : ''

  if (pageImage) {
    return pageImage
  }

  const authBackgroundImage = authConfig.backgroundImage

  return typeof authBackgroundImage === 'string' ? authBackgroundImage.trim() : ''
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
  pageLayout.value === 'card' && resolvedBackgroundImage.value
    ? ({ backgroundImage: `url('${resolvedBackgroundImage.value}')` } as const)
    : undefined,
)

const imagePanelStyle = computed(() =>
  resolvedBackgroundImage.value
    ? ({ backgroundImage: `url('${resolvedBackgroundImage.value}')` } as const)
    : undefined,
)

const isSplitImageFirst = computed(() => imagePosition.value === 'left')
const hasResolvedBackgroundImage = computed(() => Boolean(resolvedBackgroundImage.value))
const isResolvedCardSplit = computed(() =>
  pageLayout.value === 'card-split' && hasResolvedBackgroundImage.value,
)

const layoutContext = computed(() => ({
  layout: pageLayout.value,
  imagePosition: imagePosition.value,
  image: resolvedBackgroundImage.value,
  showIcon: showIcon.value,
}))

provide(authLayoutContextKey, layoutContext)
</script>

<template>
  <div
    v-if="pageLayout === 'page-split' && hasResolvedBackgroundImage"
    class="grid min-h-screen w-full bg-cover bg-center bg-no-repeat text-left lg:grid-cols-2 lg:bg-none"
    role="presentation"
    :style="imagePanelStyle"
  >
    <div
      v-if="isSplitImageFirst"
      aria-hidden="true"
      class="hidden bg-cover bg-center bg-no-repeat lg:block lg:min-h-screen"
      :style="imagePanelStyle"
    />
    <main class="flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6 lg:bg-default lg:px-12" role="main">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>
    <div
      v-if="!isSplitImageFirst"
      aria-hidden="true"
      class="hidden bg-cover bg-center bg-no-repeat lg:block lg:min-h-screen"
      :style="imagePanelStyle"
    />
  </div>

  <div
    v-else
    class="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-10 text-center"
    :class="isResolvedCardSplit ? 'bg-muted' : undefined"
    role="presentation"
    :style="pageStyle"
  >
    <main :class="isResolvedCardSplit ? 'w-full max-w-5xl' : 'w-full max-w-md'" role="main">
      <slot />
    </main>
  </div>
</template>
