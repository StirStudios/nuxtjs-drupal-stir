<script setup lang="ts">
const { cookieConsent: config } = useAppConfig()
const route = useRoute()
const open = ref(false)
const isDev = import.meta.dev
const consent = useCookie<boolean | string>('cookie_consent', {
  maxAge: 60 * 60 * 24 * 365,
})
const isConsentMode = computed(() => config?.mode === 'consent')
const isDismissible = computed(() => config?.dismissible !== false)
const primaryButtonLabel = computed(() =>
  config?.buttonLabel || (isConsentMode.value ? 'Accept' : 'Got it'),
)
const declineButtonLabel = computed(() => config?.declineButtonLabel || 'Decline')
const hasDecision = computed(() =>
  consent.value === true ||
  (typeof consent.value === 'string' && consent.value.length > 0),
)

const isConfigured = computed(() => {
  if (!config?.enabled) return false

  return Boolean(config.title && config.message)
})

function setDecision(status: 'accepted' | 'declined' | 'dismissed') {
  consent.value = status
  open.value = false
}

function accept() {
  setDecision('accepted')
}

function decline() {
  setDecision('declined')
}

function dismiss() {
  setDecision(isConsentMode.value ? 'declined' : 'dismissed')
}

const ignorePaths = computed(() =>
  [config?.termsUrl, config?.privacyUrl].filter(
    (path): path is string => typeof path === 'string' && path.length > 0,
  ),
)

const positionClass = computed(() => {
  const position = config?.position ?? 'center'

  if (position === 'left') return 'left-3 sm:left-4'
  if (position === 'right') return 'right-3 sm:right-4'
  return 'left-1/2 -translate-x-1/2'
})

watch(
  () => route.path,
  () => {
    if (!import.meta.client) return

    const isBot = navigator?.userAgent
      ? /bot|crawl|spider/i.test(navigator.userAgent)
      : false

    if (
      !hasDecision.value &&
      isConfigured.value &&
      !isBot &&
      !ignorePaths.value.includes(route.path)
    ) {
      open.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="isConfigured && open"
    :aria-label="config.title"
    aria-live="polite"
    :class="[
      'fixed bottom-3 z-50 w-[min(26rem,calc(100vw-1.5rem))] sm:bottom-4',
      positionClass,
    ]"
    role="dialog"
  >
    <UCard
      :ui="{
        root: 'bg-default text-default shadow-xl ring-1 ring-neutral-200 dark:ring-neutral-700',
        body: 'space-y-3 text-sm leading-relaxed text-default',
      }"
    >
      <div class="flex items-start justify-between gap-3">
        <p class="text-sm font-semibold text-default">
          {{ config.title }}
        </p>
        <UButton
          v-if="isDismissible"
          aria-label="Dismiss cookie notice"
          color="neutral"
          icon="i-lucide-x"
          size="xs"
          square
          variant="ghost"
          @click="dismiss"
        />
      </div>

      <p class="text-default">{{ config.message }}</p>

      <p v-if="config.termsUrl || config.privacyUrl" class="text-default">
        {{ config.messageLinks }}
        <ULink
          v-if="config.termsUrl"
          class="text-primary underline"
          rel="noopener noreferrer"
          target="_blank"
          :to="config.termsUrl"
        >
          Terms of Service
        </ULink>
        <span v-if="config.termsUrl && config.privacyUrl" class="mx-1">and</span>
        <ULink
          v-if="config.privacyUrl"
          class="text-primary underline"
          rel="noopener noreferrer"
          target="_blank"
          :to="config.privacyUrl"
        >
          Privacy Policy
        </ULink>
        .
      </p>

      <div class="flex justify-end gap-2">
        <UButton
          v-if="isConsentMode"
          color="neutral"
          :label="declineButtonLabel"
          size="xs"
          variant="soft"
          @click="decline"
        />
        <UButton :label="primaryButtonLabel" size="xs" @click="accept" />
      </div>
    </UCard>
  </div>

  <UAlert
    v-else-if="config?.enabled && isDev"
    color="warning"
    description="Cookie consent is enabled but not fully configured. Please provide title,
      and message."
    title="Heads up!"
    :ui="{
      root: `fixed bottom-3 w-[min(26rem,calc(100vw-1.5rem))] rounded-xl sm:bottom-4 ${positionClass}`,
      wrapper: 'text-center',
      description: 'opacity-100',
    }"
  />
</template>
