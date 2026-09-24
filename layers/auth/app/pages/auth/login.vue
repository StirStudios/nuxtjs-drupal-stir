<script setup lang="ts">
import { useAuthLogin } from '../../composables/useAuthLogin'
import { useAuthConfig } from '../../composables/useAuthConfig'

const {
  fields,
  turnstileToken,
  validate,
  onSubmit,
  onError,
  isLoading,
  error,
  errorActions,
} = useAuthLogin({ toastErrors: false })
const { auth } = useAuthConfig()

const title = computed(() => auth.value.login?.title || 'Sign in')
const description = computed(
  () => auth.value.login?.description || 'Sign in to continue.',
)
const submitLabel = computed(() => auth.value.login?.submitLabel || 'Sign in')

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
      icon="i-lucide-lock"
      :loading="isLoading"
      :submit="{ label: submitLabel }"
      :title="title"
      :validate="validate"
      @error="onError"
      @submit="onSubmit"
    >
      <template #password-hint>
        <ULink class="text-primary font-medium" to="/auth/password/request">
          Forgot password?
        </ULink>
      </template>
      <template #validation>
        <FieldTurnstile v-model="turnstileToken" />
        <UAlert
          v-if="error"
          :actions="errorActions"
          color="error"
          :description="error.message"
          icon="i-lucide-circle-alert"
          role="alert"
          :title="error.title"
          variant="subtle"
        />
      </template>
    </AuthCard>
  </AuthPage>
</template>
