<script setup lang="ts">
const props = defineProps<{
  currentPassword: string
  newPassword: string
  changingPassword: boolean
  cancelingAccount: boolean
  cancelModalOpen: boolean
  portal: unknown
}>()

const emit = defineEmits<{
  (e: 'update:currentPassword' | 'update:newPassword', value: string): void
  (e: 'update:cancelModalOpen', value: boolean): void
  (e: 'change-password' | 'cancel-account'): void
}>()
const themeWebform = (
  (useAppConfig().stirTheme as { webform?: { variant?: string; fieldInput?: string } })
    .webform || {}
)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

const onSubmitPassword = () => {
  emit('change-password')
}

const openCancelModal = () => {
  emit('update:cancelModalOpen', true)
}

const closeCancelModal = () => {
  emit('update:cancelModalOpen', false)
}

const confirmCancel = () => {
  emit('cancel-account')
}
</script>

<template>
  <div class="space-y-6 pt-4">
    <div class="space-y-1">
      <h2 class="text-highlighted text-base font-semibold">Security</h2>
      <p class="text-muted text-sm">Manage your password and account status.</p>
    </div>

    <UForm class="space-y-4" @submit="onSubmitPassword">
      <UFormField label="Current password" name="current_password" required>
        <UInput
          :class="themeWebform.fieldInput || 'w-full'"
          :model-value="props.currentPassword"
          :type="showCurrentPassword ? 'text' : 'password'"
          :variant="themeWebform.variant"
          @update:model-value="emit('update:currentPassword', String($event ?? ''))"
        >
          <template #trailing>
            <UButton
              color="neutral"
              :icon="showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              size="xs"
              variant="ghost"
              @click="showCurrentPassword = !showCurrentPassword"
            />
          </template>
        </UInput>
      </UFormField>
      <UFormField label="New password" name="new_password" required>
        <UInput
          :class="themeWebform.fieldInput || 'w-full'"
          :model-value="props.newPassword"
          :type="showNewPassword ? 'text' : 'password'"
          :variant="themeWebform.variant"
          @update:model-value="emit('update:newPassword', String($event ?? ''))"
        >
          <template #trailing>
            <UButton
              color="neutral"
              :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              size="xs"
              variant="ghost"
              @click="showNewPassword = !showNewPassword"
            />
          </template>
        </UInput>
      </UFormField>
      <UButton
        class="mt-5"
        :disabled="props.changingPassword"
        :loading="props.changingPassword"
        type="submit"
      >
        Update Password
      </UButton>
    </UForm>

    <div class="border-error/30 bg-error/5 mt-10 space-y-4 rounded-lg border p-4">
      <div class="space-y-1">
        <h3 class="text-highlighted text-base font-semibold">Cancel Account</h3>
        <p class="text-muted text-sm">
          Cancellation method: disable your account and keep existing content.
        </p>
      </div>
      <UButton
        class="mt-2"
        color="error"
        :disabled="props.cancelingAccount"
        variant="soft"
        @click="openCancelModal"
      >
        Cancel Account
      </UButton>
    </div>
  </div>

  <ClientOnly>
    <UModal
      :description="'This will disable your account and keep existing content.'"
      :open="props.cancelModalOpen"
      :portal="props.portal"
      title="Cancel Account?"
      @update:open="emit('update:cancelModalOpen', $event)"
    >
      <template #body>
        <div class="space-y-3 p-4">
          <p class="text-muted text-sm">
            You will be logged out after cancellation. You can contact support
            to reactivate if needed.
          </p>
          <div class="flex items-center gap-3">
            <UButton
              color="error"
              :disabled="props.cancelingAccount"
              :loading="props.cancelingAccount"
              @click="confirmCancel"
            >
              Yes, cancel account
            </UButton>
            <UButton
              :disabled="props.cancelingAccount"
              variant="ghost"
              @click="closeCancelModal"
            >
              Keep account
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>
