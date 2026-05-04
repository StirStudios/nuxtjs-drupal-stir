<script setup lang="ts">
import { useAuthAccount } from '~/composables/auth/useAuthAccount'
import { useProtectedSession } from '~/composables/auth/useProtectedSession'
import { useAuthSession } from '~/composables/auth/useAuthSession'

const { logout } = useAuthAccount()
const session = useAuthSession()
const protectedSession = useProtectedSession()
const toast = useToast()

useSeoMeta({
  robots: 'noindex, nofollow',
})

onMounted(async () => {
  try {
    await logout()
  } catch {
    // Keep logout resilient even when upstream session is already expired.
  }

  try {
    await $fetch('/api/auth/protected', {
      method: 'POST',
      body: { action: 'logout' },
    })
    protectedSession.clearSession()
  } catch {
    // Best-effort cleanup for optional protected gate session.
  }

  try {
    await session.fetchSession()
  } catch {
    session.clearSession()
  }

  toast.add({
    title: 'Signed out',
    description: 'You have been logged out.',
    color: 'success',
  })

  await navigateTo('/auth/login')
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6 text-center">
    <UPageCard class="w-full max-w-md">
      <p>Signing you out...</p>
    </UPageCard>
  </div>
</template>
