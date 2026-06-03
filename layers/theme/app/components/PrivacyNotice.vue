<script setup lang="ts">
type PrivacyNoticeLink = {
  label?: string
  title?: string
  text?: string
  url?: string
  href?: string
  to?: string
}

const appConfig = useAppConfig()
const route = useRoute()
const open = ref(false)
const isHydrated = ref(false)
const isDev = import.meta.dev
const config = computed(() => appConfig.privacyNotice)
const consent = useCookie<boolean | string>('cookie_consent', {
  maxAge: 60 * 60 * 24 * 365,
})
const isConsentMode = computed(() => config.value?.mode === 'consent')
const isDismissible = computed(() => config.value?.dismissible !== false)
const primaryButtonLabel = computed(() =>
  config.value?.buttonLabel || (isConsentMode.value ? 'Accept all' : 'Got it'),
)
const declineButtonLabel = computed(() =>
  config.value?.declineButtonLabel || (isConsentMode.value ? 'Reject all' : 'Decline'),
)
const hasDecision = computed(() =>
  consent.value === true ||
  (typeof consent.value === 'string' && consent.value.length > 0),
)
const noticeTermsUrl = computed(() =>
  config.value?.cookiePolicyUrl ? '' : config.value?.termsUrl,
)
const hasPolicyLinks = computed(() =>
  Boolean(noticeTermsUrl.value || config.value?.privacyUrl || config.value?.cookiePolicyUrl),
)

const isConfigured = computed(() => {
  if (!config.value?.enabled) return false

  return Boolean(config.value.title?.trim() && config.value.message?.trim())
})
const isSetupNotice = computed(() =>
  isDev && Boolean(config.value?.enabled) && !isConfigured.value,
)

let hasWarnedInvalidConfig = false

onMounted(() => {
  isHydrated.value = true
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

function toRoutePath(url: string) {
  try {
    return new URL(url, 'https://example.com').pathname
  } catch {
    return url
  }
}

const ignorePaths = computed(() =>
  [
    config.value?.termsUrl,
    config.value?.privacyUrl,
    config.value?.cookieConsentUrl,
    config.value?.cookiePolicyUrl,
    ...(config.value?.links || []).map((link: PrivacyNoticeLink) =>
      link.url || link.href || link.to,
    ),
    ...(config.value?.legalLinks || []).map((link: PrivacyNoticeLink) =>
      link.url || link.href || link.to,
    ),
  ]
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
    .map((url) => toRoutePath(url)),
)

const positionClass = computed(() => {
  const position = config.value?.position ?? 'center'

  if (position === 'left') return 'left-3 sm:left-4'
  if (position === 'right') return 'right-3 sm:right-4'
  return 'left-1/2 -translate-x-1/2'
})

const noticeTitle = computed(() =>
  isSetupNotice.value ? 'Privacy notice config required' : config.value?.title,
)
const noticeMessage = computed(() =>
  isSetupNotice.value
    ? 'Set `privacyNotice.title` and `privacyNotice.message` in `app.config.ts` to enable this notice.'
    : config.value?.message,
)
const noticeCardRootClass = computed(() =>
  isSetupNotice.value
    ? 'shadow-xl ring-warning/40'
    : 'shadow-xl',
)

watch(
  () => route.path,
  () => {
    if (!import.meta.client) return

    const isBot = navigator?.userAgent
      ? /bot|crawl|spider/i.test(navigator.userAgent)
      : false

    if (
      !hasDecision.value &&
      (isConfigured.value || isSetupNotice.value) &&
      !isBot &&
      !ignorePaths.value.includes(route.path)
    ) {
      open.value = true
    }
  },
  { immediate: true },
)

watchEffect(() => {
  if (!isDev || hasWarnedInvalidConfig) return
  if (!config.value?.enabled || isConfigured.value) return

  hasWarnedInvalidConfig = true
  console.warn(
    '[PrivacyNotice] Enabled but missing required config: privacyNotice.title and privacyNotice.message.',
  )
})
</script>

<template>
  <div
    v-if="isHydrated && open && (isConfigured || isSetupNotice)"
    :aria-label="noticeTitle"
    aria-live="polite"
    :class="[
      'fixed bottom-3 z-50 w-[min(26rem,calc(100vw-1.5rem))] sm:bottom-4',
      positionClass,
    ]"
    role="dialog"
  >
    <UCard
      :ui="{
        root: noticeCardRootClass,
        body: 'space-y-3 text-sm leading-relaxed text-default',
        footer: 'flex justify-end gap-2 pt-2',
        header: 'flex items-start justify-between gap-3',
      }"
      variant="outline"
    >
      <template #header>
        <p class="text-sm font-semibold text-default">
          {{ noticeTitle }}
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
      </template>

      <p class="text-default">{{ noticeMessage }}</p>

      <p v-if="isConfigured && hasPolicyLinks" class="text-default">
        {{ config.messageLinks }}
        <ULink
          v-if="noticeTermsUrl"
          class="text-primary underline"
          rel="noopener noreferrer"
          target="_blank"
          :to="noticeTermsUrl"
        >
          Terms of Service
        </ULink>
        <span v-if="noticeTermsUrl && (config.privacyUrl || config.cookiePolicyUrl)">
          and
        </span>
        <ULink
          v-if="config.privacyUrl"
          class="text-primary underline"
          rel="noopener noreferrer"
          target="_blank"
          :to="config.privacyUrl"
        >
          Privacy Policy
        </ULink>
        <span v-if="config.privacyUrl && config.cookiePolicyUrl"> and </span>
        <ULink
          v-if="config.cookiePolicyUrl"
          class="text-primary underline"
          rel="noopener noreferrer"
          target="_blank"
          :to="config.cookiePolicyUrl"
        >
          Cookie Policy
        </ULink>
      </p>

      <template v-if="isConfigured" #footer>
        <UButton
          v-if="isConsentMode"
          color="neutral"
          :label="declineButtonLabel"
          size="xs"
          variant="soft"
          @click="decline"
        />
        <UButton :label="primaryButtonLabel" size="xs" @click="accept" />
      </template>
    </UCard>
  </div>

</template>
