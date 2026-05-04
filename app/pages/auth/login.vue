<script setup lang="ts">
import { useAuthLogin } from '~/composables/auth/useAuthLogin'

const {
  fields,
  turnstileToken,
  validate,
  onSubmit,
  onError,
  isLoading,
} = useAuthLogin()

useSeoMeta({
  robots: 'noindex, nofollow',
})
</script>

<template>
  <div
    class="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 text-center"
    role="presentation"
  >
    <main class="w-full max-w-md" role="main">
      <UPageCard class="bg-default/90 w-full rounded-lg shadow-lg">
        <UAuthForm
          :description="'Sign in to continue.'"
          :fields="fields"
          icon="i-lucide-lock"
          :loading="isLoading"
          :submit="{ label: 'Continue' }"
          title="Login"
          :validate="validate"
          @error="onError"
          @submit="onSubmit"
        >
          <template #validation>
            <FieldTurnstile v-model="turnstileToken" />
          </template>
        </UAuthForm>
      </UPageCard>
    </main>
  </div>
</template>
