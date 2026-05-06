<script setup lang="ts">
import { useProtectedLogin } from '~/composables/auth/useProtectedLogin'
import { useAuthConfig } from '~/composables/auth/useAuthConfig'

const { fields, validate, onSubmit, isLoading } = useProtectedLogin()
const { auth } = useAuthConfig()

const title = computed(
  () => auth.value.protectedPage?.title || 'Protected Access',
)
const description = computed(
  () =>
    auth.value.protectedPage?.description ||
    'Enter the page password to continue.',
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
      icon="i-lucide-shield-check"
      :loading="isLoading"
      :submit="{ label: 'Continue' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit"
    />
  </AuthPage>
</template>
