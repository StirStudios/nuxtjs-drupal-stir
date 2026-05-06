<script setup lang="ts">
import { useAccountProfile } from '~/composables/account/useAccountProfile'
import { useAuthSession } from '~/composables/auth/useAuthSession'

const toast = useToast()
const session = useAuthSession()
const { fields, values, editableFields, loading, saving, load, save } =
  useAccountProfile()

const isReady = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const changingPassword = ref(false)
const cancelingAccount = ref(false)
const cancelModalOpen = ref(false)
const portal = useOverlayPortal()

const title = 'Profile'
const description = 'Update your account profile details.'
const profileTabs = [
  { label: 'Profile', icon: 'i-lucide-user-round', slot: 'profile' },
  { label: 'Security', icon: 'i-lucide-shield-check', slot: 'security' },
]
const hasProfileSave = computed(() => editableFields.value.length > 0)

const getFieldType = (type: string): 'text' | 'textarea' | 'select' | 'checkbox' => {
  if (type === 'text_long' || type === 'string_long') {
    return 'textarea'
  }

  if (type === 'boolean') {
    return 'checkbox'
  }

  if (type === 'list_string' || type === 'list_integer') {
    return 'select'
  }

  return 'text'
}

const toSelectItems = (field: {
  options?: Record<string, string>
}): Array<{ label: string; value: string }> => {
  const options = field.options || {}

  return Object.entries(options).map(([value, label]) => ({
    label,
    value,
  }))
}

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
  <div class="mx-auto w-full max-w-2xl px-4 py-8">
    <UPageCard>
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-highlighted">{{ title }}</h1>
          <p class="text-sm text-muted">{{ description }}</p>
        </div>
      </template>

      <div v-if="loading || !isReady" class="space-y-4">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-1/2" />
      </div>

      <UTabs v-else class="w-full" :items="profileTabs" variant="link">
        <template #profile>
          <UForm class="space-y-5 pt-4" :state="values" @submit="onSubmit">
            <div
              v-for="field in fields"
              :key="field.name"
              class="space-y-2"
            >
              <UFormField :label="field.label" :name="field.name" :required="field.required">
                <UCheckbox
                  v-if="getFieldType(field.type) === 'checkbox'"
                  v-model="values[field.name]"
                  :disabled="!field.editable"
                />

                <UTextarea
                  v-else-if="getFieldType(field.type) === 'textarea'"
                  v-model="values[field.name]"
                  :disabled="!field.editable"
                  :rows="4"
                />

                <USelect
                  v-else-if="getFieldType(field.type) === 'select'"
                  v-model="values[field.name]"
                  :disabled="!field.editable"
                  :items="toSelectItems(field)"
                  label-key="label"
                  value-key="value"
                />

                <UInput v-else v-model="values[field.name]" :disabled="!field.editable" type="text" />
              </UFormField>
            </div>

            <div v-if="editableFields.length === 0" class="text-sm text-muted">
              No editable profile fields are currently available.
            </div>

            <UButton :disabled="saving || !hasProfileSave" :loading="saving" type="submit">
              Save Changes
            </UButton>
          </UForm>
        </template>

        <template #security>
          <UForm class="space-y-4 pt-4" @submit="onChangePassword">
            <p class="text-sm text-muted">
              Update your account password using your current credentials.
            </p>
            <UFormField label="Current password" name="current_password" required>
              <UInput v-model="currentPassword" type="password" />
            </UFormField>
            <UFormField label="New password" name="new_password" required>
              <UInput v-model="newPassword" type="password" />
            </UFormField>
            <UButton :disabled="changingPassword" :loading="changingPassword" type="submit">
              Update Password
            </UButton>
          </UForm>

          <USeparator class="my-6" />

          <div class="space-y-4 rounded-lg border border-error/30 bg-error/5 p-4">
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">Cancel Account</h2>
              <p class="text-sm text-muted">
                Cancellation method: disable your account and keep existing content.
              </p>
            </div>
            <UButton
              class="mt-2"
              color="error"
              :disabled="cancelingAccount"
              variant="soft"
              @click="cancelModalOpen = true"
            >
              Cancel Account
            </UButton>
          </div>
        </template>
      </UTabs>
    </UPageCard>

    <ClientOnly>
      <UModal
        v-model:open="cancelModalOpen"
        description="This will disable your account and keep existing content."
        :portal="portal"
        title="Cancel Account?"
      >
        <template #body>
          <div class="space-y-3 p-4">
            <p class="text-sm text-muted">
              You will be logged out after cancellation. You can contact support to reactivate if needed.
            </p>
            <div class="flex items-center gap-3">
              <UButton
                color="error"
                :disabled="cancelingAccount"
                :loading="cancelingAccount"
                @click="onCancelAccount"
              >
                Yes, cancel account
              </UButton>
              <UButton
                :disabled="cancelingAccount"
                variant="ghost"
                @click="cancelModalOpen = false"
              >
                Keep account
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </ClientOnly>
  </div>
</template>
