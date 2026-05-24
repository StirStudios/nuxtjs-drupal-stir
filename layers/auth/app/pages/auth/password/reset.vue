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

useSeoMeta({
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AuthPage>
    <UPageCard
      v-if="isCheckingLink || !linkValid"
      class="w-full rounded-lg bg-white shadow-lg ring ring-default dark:bg-black [&_[data-slot=wrapper]]:w-full"
    >
      <AuthStatusPanel
        :description="linkMessage"
        :icon="isCheckingLink ? 'i-lucide-loader-circle' : 'i-lucide-triangle-alert'"
        :loading="isCheckingLink"
        :title="isCheckingLink ? 'Checking reset link' : 'Reset link unavailable'"
        :tone="isCheckingLink ? 'neutral' : 'warning'"
      />
      <template #footer>
        <div class="text-center text-sm text-muted">
          <ULink class="text-primary" to="/auth/password/request"
            >Request a new reset link</ULink
          >
        </div>
      </template>
    </UPageCard>
    <AuthCard
      v-else
      :description="description"
      :fields="fields"
      icon="i-lucide-lock-keyhole"
      :loading="isLoading"
      :submit="{ label: 'Update Password' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit($event as never)"
    >
      <template #password-field="{ state, field }">
        <AuthPasswordField v-model="state.password" :field="field" />
      </template>
      <template #confirmPassword-field="{ state, field }">
        <AuthPasswordField v-model="state.confirmPassword" :field="field" :show-requirements="false" />
      </template>
      <template #footer>
        <ULink class="text-primary" to="/auth/login">Back to login</ULink>
      </template>
    </AuthCard>
  </AuthPage>
</template>
