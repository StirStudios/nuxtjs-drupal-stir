<script setup lang="ts">
import { useAccountSettings } from '../../composables/account/useAccountSettings'
import { useAuthSession } from '../../composables/auth/useAuthSession'
import { accountPasswordChangeValidationSchema } from '../../utils/authValidation'
import { mapYupValidationErrors } from '../../utils/yupValidation'

definePageMeta({
  layout: false,
  accountTitle: 'Account Settings',
  accountSubtitle: 'Manage your login details and account security.',
})

const toast = useToast()
const session = useAuthSession()
const { values, hasChanges, loading, saving, load, save } = useAccountSettings()

const isReady = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const changingPassword = ref(false)
const cancelingAccount = ref(false)
const cancelModalOpen = ref(false)
const portal = useOverlayPortal()

const settingsFields = [
  {
    name: 'account_name',
    label: 'Username',
    type: 'string',
    required: true,
    editable: true,
  },
  {
    name: 'account_email',
    label: 'Email',
    type: 'email',
    required: true,
    editable: true,
  },
]
const settingsTabs = [
  { label: 'Settings', icon: 'i-lucide-user-round', slot: 'settings' },
  { label: 'Security', icon: 'i-lucide-shield-check', slot: 'security' },
]

onMounted(async () => {
  await session.fetchSession()

  if (!session.loggedIn.value) {
    await navigateTo('/auth/login')
    return
  }

  await load()
  isReady.value = true
})

const onSubmitSettings = async () => {
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
        title: 'Settings updated',
        description: 'Your changes were saved.',
        color: 'success',
      })
    }
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to save account settings.'

    toast.add({ title: 'Update failed', description: message, color: 'error' })
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
    await $fetch('/api/account/settings/password', {
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
    await $fetch('/api/account/settings/cancel', { method: 'POST' })
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
  <NuxtLayout name="account">
    <div class="border-accented bg-default rounded-xl border p-4 md:p-6">
      <div v-if="loading || !isReady" class="space-y-4">
        <USkeleton class="h-5 w-28" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-1/2" />
      </div>

      <template v-else>
        <UTabs class="w-full" :items="settingsTabs" variant="link">
          <template #settings>
            <AccountProfileForm
              :editable-fields-count="2"
              :fields="settingsFields"
              :has-profile-save="hasChanges"
              heading="Settings"
              :saving="saving"
              subheading="Update your account login details."
              :values="values"
              @submit="onSubmitSettings"
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
      </template>
    </div>
  </NuxtLayout>
</template>
