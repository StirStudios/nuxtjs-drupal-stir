<script setup lang="ts">
import type { AuthFormField, AuthFormProps, FormError } from '@nuxt/ui'

const props = defineProps<{
  title: string
  description: string
  icon?: string
  fields: AuthFormField[]
  submit: Record<string, unknown>
  ui?: AuthFormProps['ui']
  loading?: boolean
  validate?: (
    state: Record<string, unknown>,
  ) => FormError<string>[] | Promise<FormError<string>[]>
}>()

const forms = useStirFormTheme()
const fieldVariant = computed(() => resolveUiFieldVariant(forms.variant))
const themedFields = computed<AuthFormField[]>(() => props.fields.map((field) => {
  if (field.type === 'checkbox' || field.type === 'otp') return field

  return {
    ...field,
    variant: field.variant ?? fieldVariant.value,
  } as AuthFormField
}))

defineEmits<{
  submit: [event: unknown]
  error: [event: unknown]
}>()

defineSlots<{
  leading?: () => unknown
  'password-field'?: (props: { field: AuthFormField; state: Record<string, string | undefined> }) => unknown
  'confirmPassword-field'?: (props: { field: AuthFormField; state: Record<string, string | undefined> }) => unknown
  'password-hint'?: () => unknown
  validation?: () => unknown
  footer?: () => unknown
}>()
</script>

<template>
  <UAuthForm
    class="text-left"
    :description="description"
    :fields="themedFields"
    :icon="icon"
    :loading="loading"
    :submit="submit"
    :title="title"
    :ui="ui"
    :validate="validate"
    @error="$emit('error', $event)"
    @submit="$emit('submit', $event)"
  >
    <template #title>
      <h1 class="mb-0! text-xl! font-semibold!">{{ title }}</h1>
    </template>
    <template v-if="$slots.leading" #leading>
      <slot name="leading" />
    </template>
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
</template>
