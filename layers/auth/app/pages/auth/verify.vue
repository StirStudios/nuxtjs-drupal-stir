<script setup lang="ts">
const route = useRoute()

const uid = computed(() => Number.parseInt(String(route.query.uid || ''), 10))
const timestamp = computed(() =>
  Number.parseInt(String(route.query.timestamp || ''), 10),
)
const token = computed(() => String(route.query.token || '').trim())

const isLoading = ref(true)
const verified = ref(false)
const message = ref('Verifying your account...')

useSeoMeta({
  robots: 'noindex, nofollow',
})

onMounted(async () => {
  if (!Number.isInteger(uid.value) || !Number.isInteger(timestamp.value) || !token.value) {
    isLoading.value = false
    verified.value = false
    message.value = 'Verification link is invalid or incomplete.'
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
    message.value = 'Your account has been verified. You can now sign in.'
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
        : 'Verification failed or link expired.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AuthPage>
    <UPageCard class="w-full rounded-lg bg-white shadow-lg ring ring-default dark:bg-black [&_[data-slot=wrapper]]:w-full">
      <AuthStatusPanel
        :description="message"
        :icon="isLoading ? 'i-lucide-loader-circle' : verified ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
        :loading="isLoading"
        :title="isLoading ? 'Verifying account' : verified ? 'Account verified' : 'Verification failed'"
        :tone="isLoading ? 'neutral' : verified ? 'success' : 'error'"
      />
      <template #footer>
        <div class="text-center text-sm text-muted">
          <ULink class="text-primary" to="/auth/login">Back to login</ULink>
        </div>
      </template>
    </UPageCard>
  </AuthPage>
</template>
