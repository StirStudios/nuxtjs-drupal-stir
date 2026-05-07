<script setup lang="ts">
import { usePasswordRequest } from '../../../composables/auth/usePasswordRequest'
import { useAuthConfig } from '../../../composables/auth/useAuthConfig'

const { fields, turnstileToken, validate, onSubmit, isLoading } =
  usePasswordRequest()
const { auth } = useAuthConfig()

const title = computed(() => auth.value.passwordRequest?.title || 'Reset Password')
const description = computed(
  () =>
    auth.value.passwordRequest?.description ||
    'Enter your email or username to receive reset instructions.',
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
      icon="i-lucide-key-round"
      :loading="isLoading"
      :submit="{ label: 'Send Reset Instructions' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit($event as never)"
    >
      <template #validation>
        <FieldTurnstile v-model="turnstileToken" />
      </template>
      <template #footer>
        <ULink class="text-primary" to="/auth/login">Back to login</ULink>
      </template>
    </AuthCard>
  </AuthPage>
</template>
