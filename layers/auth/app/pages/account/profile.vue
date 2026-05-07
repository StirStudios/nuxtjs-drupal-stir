<script setup lang="ts">
import { useAccountProfile } from '../../composables/account/useAccountProfile'
import { useAuthSession } from '../../composables/auth/useAuthSession'
import { accountPasswordChangeValidationSchema } from '../../utils/authValidation'
import { mapYupValidationErrors } from '../../utils/yupValidation'

const toast = useToast()
const session = useAuthSession()
const { fields, values, editableFields, hasChanges, loading, saving, load, save } =
  useAccountProfile()

const isReady = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const changingPassword = ref(false)
const cancelingAccount = ref(false)
const cancelModalOpen = ref(false)
const portal = useOverlayPortal()

const title = 'Account Settings'
const profileTabs = [
  { label: 'Profile', icon: 'i-lucide-user-round', slot: 'profile' },
  { label: 'Security', icon: 'i-lucide-shield-check', slot: 'security' },
]
const hasProfileSave = computed(() => editableFields.value.length > 0 && hasChanges.value)

onMounted(async () => {
  await session.fetchSession()

  if (!session.loggedIn.value) {
    await navigateTo('/auth/login')
    return
  }

  await load()
  isReady.value = true
})

const onSubmit = async () => {
  try {
    const response = await save()

    if (response?.no_changes) {
      toast.add({
        title: 'No changes',
        description: 'There is nothing new to save.',
        color: 'neutral',
      })
      return
    }

    if (response?.updated) {
      toast.add({
        title: 'Profile updated',
        description: 'Your changes were saved.',
        color: 'success',
      })
    }
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to save profile changes.'

    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error',
    })
  }
}

const onChangePassword = async () => {
  const validationErrors = (() => {
    try {
      accountPasswordChangeValidationSchema.validateSync(
        {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
        },
        { abortEarly: false },
      )
      return []
    } catch (error: unknown) {
      return mapYupValidationErrors(error)
    }
  })()

  if (validationErrors.length > 0) {
    toast.add({
      title: 'Password update failed',
      description: validationErrors[0]?.message || 'Please review your input.',
      color: 'error',
    })
    return
  }

  changingPassword.value = true
  try {
    await $fetch('/api/account/password', {
      method: 'PATCH',
      body: {
        current_password: currentPassword.value,
        new_password: newPassword.value,
      },
    })

    currentPassword.value = ''
    newPassword.value = ''
    toast.add({
      title: 'Password updated',
      description: 'Your password was changed successfully.',
      color: 'success',
    })
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to update password.'

    toast.add({
      title: 'Password update failed',
      description: message,
      color: 'error',
    })
  } finally {
    changingPassword.value = false
  }
}

const onCancelAccount = async () => {
  cancelingAccount.value = true
  try {
    await $fetch('/api/account/cancel', { method: 'POST' })
    cancelModalOpen.value = false
    toast.add({
      title: 'Account canceled',
      description: 'Your account has been disabled.',
      color: 'success',
    })
    await navigateTo('/auth/logout')
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to cancel account.'

    toast.add({
      title: 'Cancellation failed',
      description: message,
      color: 'error',
    })
  } finally {
    cancelingAccount.value = false
  }
}
</script>

<template>
  <div class="w-full px-4 py-8">
    <div class="mx-auto w-full max-w-lg space-y-6">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-highlighted mb-0 text-xl font-semibold">{{ title }}</h1>
        <UButton icon="i-lucide-arrow-left" size="sm" to="/" variant="ghost">
          Back to site
        </UButton>
      </div>

      <div class="border-accented bg-default rounded-xl border p-4 md:p-6">
        <div v-if="loading || !isReady" class="space-y-6">
          <div class="border-accented flex items-center gap-4 border-b pb-3">
            <USkeleton class="h-5 w-20" />
            <USkeleton class="h-5 w-20" />
          </div>
          <div class="space-y-4">
            <USkeleton class="h-5 w-28" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-10 w-1/2" />
          </div>
        </div>

        <UTabs v-else class="w-full" :items="profileTabs" variant="link">
          <template #profile>
            <AccountProfileForm
              :editable-fields-count="editableFields.length"
              :fields="fields"
              :has-profile-save="hasProfileSave"
              :saving="saving"
              :values="values"
              @submit="onSubmit"
            />
          </template>

          <template #security>
            <AccountSecurityForm
              v-model:cancel-modal-open="cancelModalOpen"
              v-model:current-password="currentPassword"
              v-model:new-password="newPassword"
              :canceling-account="cancelingAccount"
              :changing-password="changingPassword"
              :portal="portal"
              @cancel-account="onCancelAccount"
              @change-password="onChangePassword"
            />
          </template>
        </UTabs>
      </div>
    </div>
  </div>
</template>
