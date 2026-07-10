<script setup lang="ts">
import { useAuthRegister } from '../../composables/auth/useAuthRegister'
import { useAuthConfig } from '../../composables/auth/useAuthConfig'

const {
  fields,
  turnstileToken,
  validate,
  onSubmit,
  isLoading,
  registrationComplete,
  registrationMessage,
  requiresVerification,
} =
  useAuthRegister()
const { auth } = useAuthConfig()

const title = computed(() => auth.value.register?.title || 'Create Account')
const description = computed(
  () => auth.value.register?.description || 'Create your account to continue.',
)
const submitLabel = computed(
  () => auth.value.register?.submitLabel || 'Create Account',
)
const verificationTitle = computed(
  () => auth.value.register?.complete?.verificationTitle || 'Verify your email',
)
const createdTitle = computed(
  () => auth.value.register?.complete?.createdTitle || 'Account created',
)

useSeoMeta({
  title: () => title.value,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AuthPage>
    <UPageCard
      v-if="registrationComplete"
      class="w-full shadow-lg"
      :ui="{ footer: 'text-center text-sm text-muted', wrapper: 'w-full' }"
      variant="outline"
    >
      <AuthStatusPanel
        :description="registrationMessage"
        :icon="requiresVerification ? 'i-lucide-mail-check' : 'i-lucide-circle-check'"
        :title="requiresVerification ? verificationTitle : createdTitle"
        :tone="requiresVerification ? 'warning' : 'success'"
      />
      <template #footer>
        <ULink class="text-primary" to="/auth/login">Back to login</ULink>
      </template>
    </UPageCard>
    <AuthCard
      v-else
      :description="description"
      :fields="fields"
      icon="i-lucide-user-plus"
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
      <template #validation>
        <FieldTurnstile v-model="turnstileToken" />
      </template>
      <template #footer>
        Already have an account?
        <ULink class="text-primary" to="/auth/login">Sign in</ULink>
      </template>
    </AuthCard>
  </AuthPage>
</template>
