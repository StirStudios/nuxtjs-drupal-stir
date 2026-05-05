<script setup lang="ts">
import { usePasswordReset } from '~/composables/auth/usePasswordReset'
import { useAuthConfig } from '~/composables/auth/useAuthConfig'

const { fields, validate, onSubmit, isLoading } = usePasswordReset()
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
    <AuthCard
      :description="description"
      :fields="fields"
      icon="i-lucide-lock-keyhole"
      :loading="isLoading"
      :submit="{ label: 'Update Password' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit"
    >
      <template #footer>
        <ULink class="text-primary" to="/auth/login">Back to login</ULink>
      </template>
    </AuthCard>
  </AuthPage>
</template>
