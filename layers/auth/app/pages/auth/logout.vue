<script setup lang="ts">
import { useAuthActions } from '../../composables/auth/useAuthActions'
import { useProtectedActions } from '../../composables/auth/useProtectedActions'
import { useAuthConfig } from '../../composables/auth/useAuthConfig'

const { logout } = useAuthActions()
const { logout: logoutProtected } = useProtectedActions()
const { logoutRedirectPath } = useAuthConfig()
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
    await logoutProtected()
  } catch {
    // Best-effort cleanup for optional protected gate session.
  }

  toast.add({
    title: 'Signed out',
    description: 'You have been logged out.',
    color: 'success',
  })

  await navigateTo(logoutRedirectPath.value)
})
</script>

<template>
  <AuthPage>
    <UPageCard class="w-full shadow-lg" variant="outline">
      <p>Signing you out...</p>
    </UPageCard>
  </AuthPage>
</template>
