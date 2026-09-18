<script setup lang="ts">
type TurnstileTheme = {
  appearance?: 'always' | 'execute' | 'interaction-only'
}

const props = withDefaults(defineProps<{
  collapseWhenInactive?: boolean
}>(), {
  collapseWhenInactive: false,
})
const turnstileToken = defineModel<string | undefined>({ default: undefined })
const themeTurnstile = ((useAppConfig().stirTheme as { turnstile?: unknown })
  .turnstile ?? {}) as TurnstileTheme
const widget = useTemplateRef<{ reset: () => void }>('widget')
const verificationFailed = ref(false)
const isInteractive = ref(false)
let clearedByWidget = false

const clearVerification = () => {
  clearedByWidget = Boolean(turnstileToken.value)
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

// Tokens are single-use: once a form has submitted one, the server has spent
// it. A parent clears the model to ask for a fresh token, so a retry after a
// failed submission does not resend a spent one. Clears raised by the widget's
// own expiry or error callbacks are left to the widget.
watch(turnstileToken, (token, previous) => {
  if (token) {
    verificationFailed.value = false
  }
  else if (previous && !clearedByWidget) {
    widget.value?.reset()
  }
  clearedByWidget = false
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
      ref="widget"
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
