import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref, toRef } from 'vue'
import { usePrivacyConsent } from '../../../layers/theme/app/composables/usePrivacyConsent'
import { useThirdPartyScript } from '../../../layers/theme/app/composables/useThirdPartyScript'

const consentCookie = ref<boolean | string | null>(null)
const appConfig = ref({
  privacyNotice: {
    enabled: true,
    mode: 'consent' as 'consent' | 'notice',
  },
  thirdPartyScripts: {
    allowedOrigins: {
      calculator: ['https://piper.b-cdn.net'],
      enzuzo: ['https://app.enzuzo.com'],
    },
  },
})

mockNuxtImport('useAppConfig', () => () => appConfig.value)
mockNuxtImport('useCookie', () => () => consentCookie)

const ScriptHarness = defineComponent({
  props: {
    immediate: {
      type: Boolean,
      default: true,
    },
    requiresConsent: {
      type: Boolean,
      default: true,
    },
    src: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { accept } = usePrivacyConsent()

    const { requestLoad } = useThirdPartyScript(toRef(props, 'src'), {
      immediate: props.immediate,
      kind: 'enzuzo',
      requiresConsent: props.requiresConsent,
    })

    return () => h('div', [
      h('button', { class: 'accept', onClick: accept }, 'Accept'),
      h('button', { class: 'load', onClick: requestLoad }, 'Load'),
    ])
  },
})

describe('useThirdPartyScript (Nuxt runtime)', () => {
  beforeEach(() => {
    consentCookie.value = null
    appConfig.value.privacyNotice.enabled = true
    appConfig.value.privacyNotice.mode = 'consent'
  })

  afterEach(() => {
    document.querySelectorAll('script[data-stir-script]').forEach(script => script.remove())
  })

  it('does not inject a nonessential script before consent', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/consent-test'
    const wrapper = await mountSuspended(ScriptHarness, { props: { src } })

    expect(document.querySelector(`script[src="${src}"]`)).toBeNull()

    await wrapper.get('.accept').trigger('click')
    await nextTick()

    expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull()
    wrapper.unmount()
  })

  it('defers an allowed script until loading is requested', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/request-test'

    appConfig.value.privacyNotice.mode = 'notice'

    const wrapper = await mountSuspended(ScriptHarness, {
      props: { immediate: false, src },
    })

    await nextTick()
    expect(document.querySelector(`script[src="${src}"]`)).toBeNull()

    await wrapper.get('.load').trigger('click')
    await nextTick()

    expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull()
    wrapper.unmount()
  })

  it('preserves immediate loading in notice mode', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/notice-test'

    appConfig.value.privacyNotice.mode = 'notice'

    const wrapper = await mountSuspended(ScriptHarness, { props: { src } })

    await nextTick()

    expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull()
    wrapper.unmount()
  })

  it('allows explicitly essential legal scripts after consent is declined', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/legal-test'

    consentCookie.value = 'declined'

    const wrapper = await mountSuspended(ScriptHarness, {
      props: { requiresConsent: false, src },
    })

    await nextTick()

    expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull()
    wrapper.unmount()
  })

  it('rejects a CMS-provided script from an untrusted origin', async () => {
    const src = 'https://malicious.example/widget.js'

    consentCookie.value = 'accepted'

    const wrapper = await mountSuspended(ScriptHarness, { props: { src } })

    await nextTick()

    expect(document.querySelector(`script[src="${src}"]`)).toBeNull()
    wrapper.unmount()
  })
})
