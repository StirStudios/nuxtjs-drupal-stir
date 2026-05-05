<script setup lang="ts">
import { useAuthRegister } from '~/composables/auth/useAuthRegister'
import { useAuthConfig } from '~/composables/auth/useAuthConfig'

const { fields, turnstileToken, validate, onSubmit, isLoading } =
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
    <AuthCard
      :description="description"
      :fields="fields"
      icon="i-lucide-user-plus"
      :loading="isLoading"
      :submit="{ label: 'Create Account' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit"
    >
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
