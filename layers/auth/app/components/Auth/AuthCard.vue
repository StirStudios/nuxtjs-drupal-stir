<script setup lang="ts">
import type { AuthFormField, FormError } from '@nuxt/ui'

const props = defineProps<{
  title: string
  description: string
  icon?: string
  fields: AuthFormField[]
  submit?: Record<string, unknown>
  loading?: boolean
  validate?: (
    state: Record<string, unknown>,
  ) => FormError<string>[] | Promise<FormError<string>[]>
}>()

const appConfig = useAppConfig()
const resolveSubmitButtonConfig = (value: unknown): Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}
const submitButton = computed(() => ({
  label: 'Continue',
  ...resolveSubmitButtonConfig(appConfig.auth?.submitButton),
  ...resolveSubmitButtonConfig(props.submit),
}))

defineEmits<{
  submit: [event: unknown]
  error: [event: unknown]
}>()

defineSlots<{
  'password-field'?: (props: { field: AuthFormField; state: Record<string, string | undefined> }) => unknown
  'confirmPassword-field'?: (props: { field: AuthFormField; state: Record<string, string | undefined> }) => unknown
  'password-hint'?: () => unknown
  validation?: () => unknown
  footer?: () => unknown
}>()
</script>

<template>
  <UPageCard class="bg-default w-full rounded-lg shadow-lg">
    <UAuthForm
      :description="description"
      :fields="fields"
      :icon="icon || 'i-lucide-lock'"
      :loading="loading"
      :submit="submitButton"
      :title="title"
      :validate="validate"
      @error="$emit('error', $event)"
      @submit="$emit('submit', $event)"
    >
      <!-- @vue-ignore UAuthForm exposes scoped field slots that are not typed upstream. -->
      <template #password-field="{ state, field }">
        <slot :field="field" name="password-field" :state="state" />
      </template>
      <!-- @vue-ignore UAuthForm exposes scoped field slots that are not typed upstream. -->
      <template #confirmPassword-field="{ state, field }">
        <slot :field="field" name="confirmPassword-field" :state="state" />
      </template>
      <template #password-hint>
        <slot name="password-hint" />
      </template>
      <template #validation>
        <slot name="validation" />
      </template>
      <template #footer>
        <slot name="footer" />
      </template>
    </UAuthForm>
  </UPageCard>
</template>
