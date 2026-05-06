<script setup lang="ts">
import { useAuthLogin } from '../../composables/auth/useAuthLogin'
import { useAuthConfig } from '../../composables/auth/useAuthConfig'

const { fields, turnstileToken, validate, onSubmit, onError, isLoading } =
  useAuthLogin()
const { auth } = useAuthConfig()

const title = computed(() => auth.value.login?.title || 'Login')
const description = computed(
  () => auth.value.login?.description || 'Sign in to continue.',
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
      icon="i-lucide-lock"
      :loading="isLoading"
      :submit="{ label: 'Continue' }"
      :title="title"
      :validate="validate"
      @error="onError"
      @submit="onSubmit"
    >
      <template #validation>
        <FieldTurnstile v-model="turnstileToken" />
      </template>
    </AuthCard>
  </AuthPage>
</template>
