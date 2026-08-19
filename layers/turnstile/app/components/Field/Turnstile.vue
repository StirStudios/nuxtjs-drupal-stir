<script setup lang="ts">
type TurnstileTheme = {
  appearance?: 'always' | 'execute' | 'interaction-only'
}

const props = withDefaults(defineProps<{
  collapseWhenInactive?: boolean
}>(), {
  collapseWhenInactive: false,
})
const turnstileToken = defineModel<string>()
const themeTurnstile = ((useAppConfig().stirTheme as { turnstile?: unknown })
  .turnstile ?? {}) as TurnstileTheme
const verificationFailed = ref(false)

const clearVerification = () => {
  turnstileToken.value = ''
}

const handleVerificationError = () => {
  clearVerification()
  verificationFailed.value = true
  return true
}

watch(turnstileToken, (token) => {
  if (token) verificationFailed.value = false
})
</script>

<template>
  <div
    :class="[
      'text-sm',
      {
        'absolute has-[iframe]:relative':
          props.collapseWhenInactive && !verificationFailed,
        'pt-8': verificationFailed,
      },
    ]"
  >
    <LazyNuxtTurnstile
      v-model="turnstileToken"
      class="max-w-xs overflow-x-hidden"
      :options="{
        appearance: themeTurnstile.appearance,
        size: 'flexible',
        'error-callback': handleVerificationError,
        'expired-callback': clearVerification,
        'timeout-callback': handleVerificationError,
      }"
    />
    <p v-if="verificationFailed" class="text-error mt-2" role="alert">
      Security verification could not be completed. Please refresh the page and
      try again.
    </p>
  </div>
</template>
