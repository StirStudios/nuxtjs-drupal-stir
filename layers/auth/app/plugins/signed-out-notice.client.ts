/**
 * Tells a member why they were signed out when another device took over.
 *
 * Drupal's Session Limit module signs out the oldest session once an account
 * is signed in on too many devices, and the session API reports that once.
 * Without a word here, the member would just find themselves signed out.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { signedOutReason } = useAuthSession()
  const toast = useToast()

  const notify = () => {
    if (signedOutReason.value !== 'session_limit') return

    toast.add({
      title: 'Signed out',
      description: 'Your account signed in on another device, so you were signed out here.',
      color: 'warning',
    })
    signedOutReason.value = null
  }

  nuxtApp.hook('app:mounted', () => {
    notify()
    watch(signedOutReason, notify)
  })
})
