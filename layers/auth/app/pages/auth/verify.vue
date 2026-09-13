<script setup lang="ts">
import { useAuthVerify } from '../../composables/auth/useAuthVerify'

const { isLoading, verified, message, title, loginTarget, verify } = useAuthVerify()

useSeoMeta({
  title: () => title.value,
  robots: 'noindex, nofollow',
})

onMounted(verify)
</script>

<template>
  <AuthPage>
    <template #secondary-action>
      <AuthSecondaryAction :to="loginTarget" />
    </template>
    <AuthPageCard>
      <AuthStatusPanel
        :description="message"
        :icon="isLoading ? 'i-lucide-loader-circle' : verified ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
        :loading="isLoading"
        :title="title"
        :tone="isLoading ? 'neutral' : verified ? 'success' : 'error'"
      />
    </AuthPageCard>
  </AuthPage>
</template>
