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
      class="bg-default/90 w-full rounded-lg shadow-lg"
    >
      <UAlert
        :color="isCheckingLink ? 'neutral' : 'warning'"
        :description="linkMessage"
        :icon="isCheckingLink ? 'i-lucide-loader-circle' : 'i-lucide-triangle-alert'"
        :title="isCheckingLink ? 'Checking reset link' : 'Reset link unavailable'"
        variant="soft"
      />
      <template #footer>
        <div class="text-sm text-center">
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
