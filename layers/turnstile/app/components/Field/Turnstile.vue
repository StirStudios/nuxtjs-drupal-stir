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
const isInteractive = ref(false)

const clearVerification = () => {
  turnstileToken.value = ''
  isInteractive.value = false
}

const handleVerificationError = () => {
  clearVerification()
  verificationFailed.value = true
  return true
}

const handleInteractiveStart = () => {
  isInteractive.value = true
}

const handleInteractiveEnd = () => {
  isInteractive.value = false
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
        'mb-0!':
          props.collapseWhenInactive &&
          !isInteractive &&
          !verificationFailed,
      },
    ]"
  >
    <LazyNuxtTurnstile
      v-model="turnstileToken"
      class="max-w-xs overflow-x-hidden"
      :options="{
        appearance: themeTurnstile.appearance,
        size: 'flexible',
        'after-interactive-callback': handleInteractiveEnd,
        'before-interactive-callback': handleInteractiveStart,
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
