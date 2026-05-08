<script setup lang="ts">
import type { AuthFormField, FormError } from '@nuxt/ui'

defineProps<{
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

defineEmits<{
  submit: [event: unknown]
  error: [event: unknown]
}>()
</script>

<template>
  <UPageCard class="bg-default/90 w-full rounded-lg shadow-lg">
    <UAuthForm
      :description="description"
      :fields="fields"
      :icon="icon || 'i-lucide-lock'"
      :loading="loading"
      :submit="submit || { label: 'Continue' }"
      :title="title"
      :validate="validate"
      @error="$emit('error', $event)"
      @submit="$emit('submit', $event)"
    >
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
