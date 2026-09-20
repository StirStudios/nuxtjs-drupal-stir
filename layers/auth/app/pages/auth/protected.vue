<script setup lang="ts">
import { useProtectedLogin } from '../../composables/useProtectedLogin'
import { useAuthConfig } from '../../composables/useAuthConfig'

const {
  fields,
  turnstileKey,
  turnstileToken,
  validate,
  onSubmit,
  isLoading,
} = useProtectedLogin()
const { auth } = useAuthConfig()

const title = computed(
  () => auth.value.protectedPage?.title || 'Protected access',
)
const description = computed(
  () =>
    auth.value.protectedPage?.description ||
    'Enter the page password to continue.',
)

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
      icon="i-lucide-shield-check"
      :loading="isLoading"
      :submit="{ label: 'Continue' }"
      :title="title"
      :validate="validate"
      @submit="onSubmit($event as never)"
    >
      <template #validation>
        <FieldTurnstile :key="turnstileKey" v-model="turnstileToken" />
      </template>
    </AuthCard>
  </AuthPage>
</template>
