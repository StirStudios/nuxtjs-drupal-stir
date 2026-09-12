<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { useAuthConfig } from '../../composables/auth/useAuthConfig'
import { createAccountPasswordChangeValidationSchema } from '../../utils/authValidation'
import { validateForm } from '../../utils/validationErrors'

const props = defineProps<{
  currentPassword: string
  newPassword: string
  changingPassword: boolean
  cancelingAccount: boolean
  cancelModalOpen: boolean
  portal: string | boolean | HTMLElement | undefined
}>()

const emit = defineEmits<{
  (e: 'update:currentPassword' | 'update:newPassword', value: string): void
  (e: 'update:cancelModalOpen', value: boolean): void
  (e: 'change-password' | 'cancel-account'): void
}>()
const themeWebform = (
  (
    useAppConfig().stirTheme as {
      webform?: { fieldVariant?: 'outline' | 'material' | 'soft' | 'subtle' | 'ghost' | 'none'; fieldInput?: string }
    }
  ).webform || {}
)
const webformVariant = computed(() => themeWebform.fieldVariant as never)
const showCurrentPassword = ref(false)
const { auth } = useAuthConfig()

const onSubmitPassword = () => {
  emit('change-password')
}

const toggleCurrentPassword = () => {
  showCurrentPassword.value = !showCurrentPassword.value
}

const validate = (state: {
  currentPassword?: string
  newPassword?: string
}): FormError[] => {
  return validateForm(
    createAccountPasswordChangeValidationSchema(
      auth.value.passwordPolicy,
    ),
    state,
  )
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

    <UForm
      class="space-y-4"
      :state="{ currentPassword: props.currentPassword, newPassword: props.newPassword }"
      :validate="validate"
      @submit="onSubmitPassword"
    >
      <UFormField label="Current password" name="currentPassword" required>
        <UInput
          :class="themeWebform.fieldInput || 'w-full'"
          :model-value="props.currentPassword"
          :type="showCurrentPassword ? 'text' : 'password'"
          :variant="webformVariant"
          @update:model-value="emit('update:currentPassword', String($event ?? ''))"
        >
          <template #trailing>
            <UButton
              :aria-label="showCurrentPassword ? 'Hide current password' : 'Show current password'"
              color="neutral"
              :icon="showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              size="xs"
              variant="ghost"
              @click="toggleCurrentPassword"
            />
          </template>
        </UInput>
      </UFormField>
      <UFormField label="New password" name="newPassword" required>
        <AuthPasswordField
          :model-value="props.newPassword"
          :password-policy="auth.passwordPolicy"
          @update:model-value="emit('update:newPassword', String($event ?? ''))"
        />
      </UFormField>
      <UButton
        class="mt-5"
        :disabled="props.changingPassword"
        :loading="props.changingPassword"
        type="submit"
      >
        Update password
      </UButton>
    </UForm>

    <div class="border-error/30 bg-error/5 mt-10 space-y-4 rounded-lg border p-4">
      <div class="space-y-1">
        <h3 class="text-highlighted text-base font-semibold">Cancel account</h3>
        <p class="text-muted text-sm">
          This disables your account and keeps your existing content.
        </p>
      </div>
      <UButton
        class="mt-2"
        color="error"
        :disabled="props.cancelingAccount"
        variant="soft"
        @click="openCancelModal"
      >
        Cancel account
      </UButton>
    </div>
  </div>

  <ClientOnly>
    <UModal
      :description="'This disables your account and keeps your existing content.'"
      :open="props.cancelModalOpen"
      :portal="props.portal"
      title="Cancel your account?"
      @update:open="emit('update:cancelModalOpen', $event)"
    >
      <template #body>
        <div class="space-y-3 p-4">
          <p class="text-muted text-sm">
            You'll be signed out right away. Contact us if you want to reactivate later.
          </p>
          <div class="flex items-center gap-3">
            <UButton
              color="error"
              :disabled="props.cancelingAccount"
              :loading="props.cancelingAccount"
              @click="confirmCancel"
            >
              Cancel account
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
