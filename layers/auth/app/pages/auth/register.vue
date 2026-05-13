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

useSeoMeta({
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AuthPage>
    <UPageCard
      v-if="registrationComplete"
      class="bg-default/90 w-full rounded-lg shadow-lg"
    >
      <UAlert
        :color="requiresVerification ? 'warning' : 'success'"
        :description="registrationMessage"
        icon="i-lucide-mail-check"
        :title="requiresVerification ? 'Verify your email' : 'Account created'"
        variant="soft"
      />
      <template #footer>
        <div class="text-sm text-center">
          <ULink class="text-primary" to="/auth/login">Back to login</ULink>
        </div>
      </template>
    </UPageCard>
    <AuthCard
      v-else
      :description="description"
      :fields="fields"
      icon="i-lucide-user-plus"
      :loading="isLoading"
      :submit="{ label: 'Create Account' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit($event as never)"
    >
      <template #password-field="{ state, field }">
        <AuthPasswordField v-model="state.password" :field="field" />
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
