<script setup lang="ts">
import { usePasswordReset } from '../../../composables/auth/usePasswordReset'
import { useAuthConfig } from '../../../composables/auth/useAuthConfig'

const { fields, validate, onSubmit, isLoading, isCheckingLink, linkValid, linkMessage } =
  usePasswordReset()
const { auth } = useAuthConfig()

const title = computed(() => auth.value.passwordReset?.title || 'Choose a New Password')
const description = computed(
  () => auth.value.passwordReset?.description || 'Set a new password for your account.',
)
const submitLabel = computed(
  () => auth.value.passwordReset?.submitLabel || 'Update Password',
)
const checkingTitle = computed(
  () => auth.value.passwordReset?.checkingTitle || 'Checking reset link',
)
const unavailableTitle = computed(
  () => auth.value.passwordReset?.unavailableTitle || 'Reset link unavailable',
)

useSeoMeta({
  title: () => title.value,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AuthPage>
    <UPageCard
      v-if="isCheckingLink || !linkValid"
      class="w-full shadow-lg"
      :ui="{ footer: 'text-center text-sm text-muted', wrapper: 'w-full' }"
      variant="outline"
    >
      <AuthStatusPanel
        :description="linkMessage"
        :icon="isCheckingLink ? 'i-lucide-loader-circle' : 'i-lucide-triangle-alert'"
        :loading="isCheckingLink"
        :title="isCheckingLink ? checkingTitle : unavailableTitle"
        :tone="isCheckingLink ? 'neutral' : 'warning'"
      />
      <template #footer>
        <ULink class="text-primary" to="/auth/password/request">
          Request a new reset link
        </ULink>
      </template>
    </UPageCard>
    <AuthCard
      v-else
      :description="description"
      :fields="fields"
      icon="i-lucide-lock-keyhole"
      :loading="isLoading"
      :submit="{ label: submitLabel }"
      :title="title"
      :validate="validate"
      @submit="onSubmit($event as never)"
    >
      <template #password-field="{ state, field }">
        <AuthPasswordField
          v-model="state.password"
          :field="field"
          :password-policy="auth.passwordPolicy"
        />
      </template>
      <template #confirmPassword-field="{ state, field }">
        <AuthPasswordField
          v-model="state.confirmPassword"
          :field="field"
          hide-strength
          :password-policy="auth.passwordPolicy"
        />
      </template>
      <template #footer>
        <ULink class="text-primary" to="/auth/login">Back to login</ULink>
      </template>
    </AuthCard>
  </AuthPage>
</template>
