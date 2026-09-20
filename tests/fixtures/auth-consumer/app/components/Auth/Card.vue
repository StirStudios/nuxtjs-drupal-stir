<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
import type { AuthFormState } from '#stir-auth/types/auth'

/**
 * Stands in for a site that shadows the layer's AuthCard.
 *
 * It exists to prove two things stay true for downstream overrides: the
 * `#stir-auth/types` alias resolves, and emitting the same event types the
 * layer emits keeps the layer's own typed handlers assignable.
 */
defineEmits<{
  submit: [event: FormSubmitEvent<AuthFormState>]
  error: [event: FormErrorEvent]
}>()
</script>

<template>
  <div>
    <slot />
  </div>
</template>
