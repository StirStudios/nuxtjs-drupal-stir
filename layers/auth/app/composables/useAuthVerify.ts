import type { MaybeRefOrGetter } from 'vue'
import { useAuthConfig } from './useAuthConfig'
import { safeStirAuthRedirect, stirAuthLoginTarget } from '../utils/authRedirect'

export interface StirAuthVerifyOptions {
  /**
   * Destination to carry through to sign-in when the verification link has no
   * usable `?redirect=`, such as a destination remembered before sign-up.
   *
   * Held to the same same-site rule as `?redirect=`; an unsafe value is
   * ignored rather than trusted.
   */
  fallbackRedirect?: MaybeRefOrGetter<string | null | undefined>
}

const VERIFIED_NAVIGATION_DELAY_MS = 1200

export function useAuthVerify(options: StirAuthVerifyOptions = {}) {
  const route = useRoute()
  const { auth } = useAuthConfig()

  const uid = computed(() => Number.parseInt(String(route.query.uid || ''), 10))
  const timestamp = computed(() =>
    Number.parseInt(String(route.query.timestamp || ''), 10),
  )
  const token = computed(() => String(route.query.token || '').trim())
  const redirect = computed(() =>
    safeStirAuthRedirect(route.query.redirect)
    ?? safeStirAuthRedirect(toValue(options.fallbackRedirect)),
  )
  const loginTarget = computed(() => stirAuthLoginTarget(redirect.value))

  const isLoading = ref(true)
  const verified = ref(false)
  const message = ref(
    auth.value.verify?.loadingDescription || 'Verifying your account...',
  )

  const title = computed(() => {
    if (isLoading.value) {
      return auth.value.verify?.loadingTitle || 'Verifying account'
    }

    return verified.value
      ? auth.value.verify?.successTitle || 'Account verified'
      : auth.value.verify?.failedTitle || 'Verification failed'
  })

  const verify = async () => {
    if (!Number.isInteger(uid.value) || !Number.isInteger(timestamp.value) || !token.value) {
      isLoading.value = false
      verified.value = false
      message.value =
        auth.value.verify?.invalidDescription ||
        'Verification link is invalid or incomplete.'
      return
    }

    try {
      await $fetch('/api/auth/verify', {
        method: 'POST',
        body: {
          uid: uid.value,
          timestamp: timestamp.value,
          token: token.value,
        },
      })

      verified.value = true
      message.value =
        auth.value.verify?.successDescription ||
        'Your account has been verified. You can now sign in.'
      await new Promise(resolve => setTimeout(resolve, VERIFIED_NAVIGATION_DELAY_MS))
      await navigateTo(loginTarget.value)
    } catch (error: unknown) {
      verified.value = false
      message.value =
        typeof error === 'object' &&
        error !== null &&
        'statusMessage' in error &&
        typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
          ? (error as { statusMessage: string }).statusMessage
          : auth.value.verify?.failedDescription ||
            'Verification failed or link expired.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    verified,
    message,
    title,
    loginTarget,
    verify,
  }
}
