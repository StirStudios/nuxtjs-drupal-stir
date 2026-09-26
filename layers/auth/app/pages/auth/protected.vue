<script setup lang="ts">
import { useProtectedLogin } from '../../composables/useProtectedLogin'
import { useAuthConfig } from '../../composables/useAuthConfig'
import type { AuthThemeConfig } from '../../types/theme'
import { hasConfiguredSecondaryAction } from '../../utils/authTheme'

const {
  fields,
  turnstileKey,
  turnstileToken,
  validate,
  onSubmit,
  isLoading,
} = useProtectedLogin()
const { auth } = useAuthConfig()

const title = computed(
  () => auth.value.protectedPage?.title || 'Protected access',
)
const description = computed(
  () =>
    auth.value.protectedPage?.description ||
    'Enter the page password to continue.',
)

// The gate has no login to fall back to, so it shows a secondary action only
// when the site configures one, e.g. an enquiry link.
const appConfig = useAppConfig()
const showSecondaryAction = computed(() =>
  hasConfiguredSecondaryAction(
    ((appConfig.stirTheme || {}) as { auth?: AuthThemeConfig }).auth || {},
    'protectedPage',
  ),
)

useSeoMeta({
  title: () => title.value,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AuthPage>
    <AuthCard
      :description="description"
      :fields="fields"
      icon="i-lucide-shield-check"
      :loading="isLoading"
      :submit="{ label: 'Continue' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit"
    >
      <template #validation>
        <FieldTurnstile :key="turnstileKey" v-model="turnstileToken" />
      </template>
      <template v-if="showSecondaryAction" #footer>
        <AuthSecondaryAction />
      </template>
    </AuthCard>
  </AuthPage>
</template>
