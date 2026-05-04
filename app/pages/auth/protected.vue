<script setup lang="ts">
import { useProtectedLogin } from '~/composables/auth/useProtectedLogin'

const { fields, validate, onSubmit, isLoading } = useProtectedLogin()

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
          description="Enter the page password to continue."
          :fields="fields"
          icon="i-lucide-shield-check"
          :loading="isLoading"
          :submit="{ label: 'Continue' }"
          title="Protected Access"
          :validate="validate"
          @submit="onSubmit"
        />
      </UPageCard>
    </main>
  </div>
</template>
