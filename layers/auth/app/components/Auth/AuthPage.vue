<script setup lang="ts">
import {
  resolveUiButtonVariant,
  resolveUiColor,
} from '../../utils/nuxtUiProps'
import {
  authLayoutContextKey,
  defaultAuthImagePosition,
  defaultAuthLayout,
  resolveAuthImagePosition,
  resolveAuthLayout,
  type AuthImagePosition,
  type AuthLayout,
} from '../../utils/authLayout'
import type {
  AuthPageConfig,
  AuthThemeConfig,
} from '../../types/theme'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const appConfig = useAppConfig()
const $img = useImage()
const resolveImage = $img as unknown as (
  source: string,
  modifiers?: {
    width?: number | string
    height?: number | string
    quality?: number | string
    format?: string
  },
) => string

type AuthPageConfigKey =
  | 'login'
  | 'logout'
  | 'protectedPage'
  | 'register'
  | 'passwordRequest'
  | 'passwordReset'
  | 'verify'

const resolveAuthPageKey = (): AuthPageConfigKey | null => {
  const explicitKey = route.meta.authPageKey

  if (typeof explicitKey === 'string' && explicitKey.trim()) {
    switch (explicitKey) {
      case 'login':
      case 'logout':
      case 'protectedPage':
      case 'register':
      case 'passwordRequest':
      case 'passwordReset':
      case 'verify':
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
  if (path.endsWith('/auth/logout')) return 'logout'
  if (path.endsWith('/auth/protected')) return 'protectedPage'
  if (path.endsWith('/auth/register')) return 'register'
  if (path.endsWith('/auth/password/request')) return 'passwordRequest'
  if (path.endsWith('/auth/password/reset')) return 'passwordReset'
  if (path.endsWith('/auth/verify')) return 'verify'

  return null
}

const resolveConfigString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const authPageKey = computed(resolveAuthPageKey)
const themeAuth = computed<AuthThemeConfig>(() => {
  const theme = (appConfig.stirTheme || {}) as {
    auth?: AuthThemeConfig
  }

  return theme.auth || {}
})
const themePageConfig = computed<AuthPageConfig>(() =>
  authPageKey.value ? themeAuth.value.pages?.[authPageKey.value] || {} : {},
)

const pageBackgroundClass = computed(() =>
  resolveConfigString(
    themePageConfig.value.backgroundClass,
    resolveConfigString(
      themeAuth.value.backgroundClass,
      'bg-muted/50 dark:bg-default',
    ),
  ),
)

const showBackgroundDecoration = computed(() => {
  if (typeof themePageConfig.value.showBackgroundDecoration === 'boolean') {
    return themePageConfig.value.showBackgroundDecoration
  }

  if (typeof themeAuth.value.showBackgroundDecoration === 'boolean') {
    return themeAuth.value.showBackgroundDecoration
  }

  return true
})

const pageLayout = computed<AuthLayout>(() =>
  resolveAuthLayout(themePageConfig.value.layout) ||
  resolveAuthLayout(themeAuth.value.layout) ||
  defaultAuthLayout,
)

const imagePosition = computed<AuthImagePosition>(() =>
  resolveAuthImagePosition(themePageConfig.value.imagePosition) ||
  resolveAuthImagePosition(themeAuth.value.imagePosition) ||
  defaultAuthImagePosition,
)

const showIcon = computed(() => {
  if (typeof themePageConfig.value.showIcon === 'boolean') {
    return themePageConfig.value.showIcon
  }

  if (typeof themeAuth.value.showIcon === 'boolean') {
    return themeAuth.value.showIcon
  }

  return true
})

const backButtonConfig = computed(() => ({
  ...themeAuth.value.backButton,
  ...themePageConfig.value.backButton,
}))

const pageBackgroundImage = computed(() => {
  const themePageImage = themePageConfig.value.backgroundImage?.trim() || ''

  if (themePageImage) {
    return themePageImage
  }

  const themeImage = themeAuth.value.backgroundImage?.trim() || ''

  if (themeImage) {
    return themeImage
  }

  return ''
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

const deliveredBackgroundImage = computed(() => {
  const image = resolvedBackgroundImage.value

  if (!image) {
    return ''
  }

  return resolveImage(image, {
    width: 1920,
    quality: 80,
    format: 'webp',
  })
})

const pageStyle = computed(() =>
  pageLayout.value === 'card' && deliveredBackgroundImage.value
    ? ({ backgroundImage: `url('${deliveredBackgroundImage.value}')` } as const)
    : undefined,
)

const imagePanelStyle = computed(() =>
  deliveredBackgroundImage.value
    ? ({ backgroundImage: `url('${deliveredBackgroundImage.value}')` } as const)
    : undefined,
)

const isSplitImageFirst = computed(() => imagePosition.value === 'left')
const hasResolvedBackgroundImage = computed(() => Boolean(resolvedBackgroundImage.value))
const isResolvedCardSplit = computed(() =>
  pageLayout.value === 'card-split' && hasResolvedBackgroundImage.value,
)

const backButtonProps = computed(() => ({
  show: backButtonConfig.value.enabled === true,
  label: resolveConfigString(backButtonConfig.value.label, 'Back'),
  to: resolveConfigString(backButtonConfig.value.to, '/'),
  class: resolveConfigString(backButtonConfig.value.class, 'fixed bottom-4 left-4 z-50 shadow-md'),
  icon: resolveConfigString(backButtonConfig.value.icon, 'i-lucide-arrow-left'),
  color: resolveUiColor(backButtonConfig.value.color, 'neutral'),
  variant: resolveUiButtonVariant(backButtonConfig.value.variant, 'ghost'),
}))

const layoutContext = computed(() => ({
  layout: pageLayout.value,
  imagePosition: imagePosition.value,
  image: deliveredBackgroundImage.value,
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
      class="hidden min-h-screen bg-cover bg-center bg-no-repeat lg:block"
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
      class="hidden min-h-screen bg-cover bg-center bg-no-repeat lg:block"
      :style="imagePanelStyle"
    />
  </div>

  <div
    v-else
    class="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-10 text-center"
    :class="[pageBackgroundClass, { 'bg-muted': isResolvedCardSplit }]"
    role="presentation"
    :style="pageStyle"
  >
    <div
      v-if="showBackgroundDecoration && !hasResolvedBackgroundImage"
      aria-hidden="true"
      class="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-primary/15 blur-3xl sm:size-96"
    />
    <div
      v-if="showBackgroundDecoration && !hasResolvedBackgroundImage"
      aria-hidden="true"
      class="pointer-events-none absolute -right-24 -bottom-32 size-80 rounded-full bg-primary/10 blur-3xl sm:size-96"
    />
    <main
      class="relative z-10"
      :class="isResolvedCardSplit ? 'w-full max-w-5xl' : 'w-full max-w-md'"
      role="main"
    >
      <slot />
    </main>
  </div>

  <UButton
    v-if="backButtonProps.show"
    :class="backButtonProps.class"
    :color="backButtonProps.color"
    :icon="backButtonProps.icon"
    :label="backButtonProps.label"
    :to="backButtonProps.to"
    :variant="backButtonProps.variant"
  />
</template>
