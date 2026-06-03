<script setup lang="ts">
import { useAuthConfig } from '../../composables/auth/useAuthConfig'

const route = useRoute()
const { auth } = useAuthConfig()

const uid = computed(() => Number.parseInt(String(route.query.uid || ''), 10))
const timestamp = computed(() =>
  Number.parseInt(String(route.query.timestamp || ''), 10),
)
const token = computed(() => String(route.query.token || '').trim())

const isLoading = ref(true)
const verified = ref(false)
const message = ref(
  auth.value.verify?.loadingDescription || 'Verifying your account...',
)

const loadingTitle = computed(
  () => auth.value.verify?.loadingTitle || 'Verifying account',
)
const successTitle = computed(
  () => auth.value.verify?.successTitle || 'Account verified',
)
const failedTitle = computed(
  () => auth.value.verify?.failedTitle || 'Verification failed',
)
const title = computed(() => {
  if (isLoading.value) {
    return loadingTitle.value
  }

  return verified.value ? successTitle.value : failedTitle.value
})

useSeoMeta({
  title: () => title.value,
  robots: 'noindex, nofollow',
})

onMounted(async () => {
  if (!Number.isInteger(uid.value) || !Number.isInteger(timestamp.value) || !token.value) {
    isLoading.value = false
    verified.value = false
    message.value =
      auth.value.verify?.invalidDescription ||
      'Verification link is invalid or incomplete.'
    return
  }

  try {
    await $fetch('/api/auth/verify', {
      method: 'POST',
      body: {
        uid: uid.value,
        timestamp: timestamp.value,
        token: token.value,
      },
    })

    verified.value = true
    message.value =
      auth.value.verify?.successDescription ||
      'Your account has been verified. You can now sign in.'
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await navigateTo('/auth/login')
  } catch (error: unknown) {
    verified.value = false
    message.value =
      typeof error === 'object' &&
      error !== null &&
      'statusMessage' in error &&
      typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
        ? (error as { statusMessage: string }).statusMessage
        : auth.value.verify?.failedDescription ||
          'Verification failed or link expired.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AuthPage>
    <UPageCard
      class="w-full shadow-lg"
      :ui="{ footer: 'text-center text-sm text-muted', wrapper: 'w-full' }"
      variant="outline"
    >
      <AuthStatusPanel
        :description="message"
        :icon="isLoading ? 'i-lucide-loader-circle' : verified ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
        :loading="isLoading"
        :title="isLoading ? loadingTitle : verified ? successTitle : failedTitle"
        :tone="isLoading ? 'neutral' : verified ? 'success' : 'error'"
      />
      <template #footer>
        <ULink class="text-primary" to="/auth/login">Back to login</ULink>
      </template>
    </UPageCard>
  </AuthPage>
</template>
