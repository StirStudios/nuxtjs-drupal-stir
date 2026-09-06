import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref, toRef } from 'vue'
import { usePrivacyConsent } from '../../../layers/integrations/app/composables/usePrivacyConsent'
import { useThirdPartyScript } from '../../../layers/theme/app/composables/useThirdPartyScript'
import ParagraphEnzuzo from '../../../layers/theme/app/components/global/Paragraph/Enzuzo.vue'

const consentCookie = ref<boolean | string | null>(null)
const appConfig = ref({
  colorMode: {
    forced: false,
    preference: 'system',
    showToggle: true,
    lightRoutes: [],
    darkRoutes: [],
  },
  icon: {
    provider: 'none',
  },
  ui: {
    colors: {
      neutral: 'slate',
      primary: 'green',
    },
    prefix: 'ui',
  },
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

    const { requestLoad, isLoaded, error } = useThirdPartyScript(toRef(props, 'src'), {
      // Prevent happy-dom from auto-completing disabled external script loads.
      attrs: { type: 'application/x-stir-test' },
      immediate: props.immediate,
      kind: 'enzuzo',
      requiresConsent: props.requiresConsent,
    })

    return () => h('div', [
      h('span', { class: 'loaded' }, String(isLoaded.value)),
      h('span', { class: 'error' }, error.value?.message || ''),
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

    await vi.waitFor(() => expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull())
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

    await vi.waitFor(() => expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull())
    wrapper.unmount()
  })

  it('preserves immediate loading in notice mode', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/notice-test'

    appConfig.value.privacyNotice.mode = 'notice'

    const wrapper = await mountSuspended(ScriptHarness, { props: { src } })

    await nextTick()

    await vi.waitFor(() => expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull())
    wrapper.unmount()
  })

  it('allows explicitly essential legal scripts after consent is declined', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/legal-test'

    consentCookie.value = 'declined'

    const wrapper = await mountSuspended(ScriptHarness, {
      props: { requiresConsent: false, src },
    })

    await nextTick()

    await vi.waitFor(() => expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull())
    wrapper.unmount()
  })

  it('renders the Enzuzo script beside its policy root', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/component-test'
    const wrapper = await mountSuspended(ParagraphEnzuzo, {
      attachTo: document.body,
      props: { embedUrl: src },
    })

    await nextTick()

    const root = wrapper.get('#__enzuzo-root').element
    const script = document.getElementById('__enzuzo-root-script')

    expect(script, document.body.innerHTML).not.toBeNull()
    expect(root.nextElementSibling).toBe(script)
    expect(script?.getAttribute('src')).toBe(src)
    wrapper.unmount()
  })

  it('loads a changed allowed URL and ignores the previous load completion', async () => {
    const first = 'https://app.enzuzo.com/scripts/privacy/url-first'
    const second = 'https://app.enzuzo.com/scripts/privacy/url-second'

    appConfig.value.privacyNotice.mode = 'notice'
    const wrapper = await mountSuspended(ScriptHarness, { props: { src: first } })

    await vi.waitFor(() => expect(document.querySelector(`script[src="${first}"]`)).not.toBeNull())
    await wrapper.setProps({ src: second })
    await vi.waitFor(() => expect(document.querySelector(`script[src="${second}"]`)).not.toBeNull())
    document.querySelector(`script[src="${first}"]`)!.dispatchEvent(new Event('load'))
    await nextTick()
    expect(wrapper.get('.loaded').text()).toBe('false')
    document.querySelector(`script[src="${second}"]`)!.dispatchEvent(new Event('load'))
    await vi.waitFor(() => expect(wrapper.get('.loaded').text()).toBe('true'))
    wrapper.unmount()
  })

  it('replaces a failed script on explicit retry', async () => {
    const src = 'https://app.enzuzo.com/scripts/privacy/retry-test'

    appConfig.value.privacyNotice.mode = 'notice'
    const wrapper = await mountSuspended(ScriptHarness, { props: { src } })

    await vi.waitFor(() => expect(document.querySelector(`script[src="${src}"]`)).not.toBeNull())
    const failed = document.querySelector(`script[src="${src}"]`)!

    failed.dispatchEvent(new Event('error'))
    await vi.waitFor(() => expect(wrapper.get('.error').text()).not.toBe(''))
    await wrapper.get('.load').trigger('click')
    await vi.waitFor(() => {
      const replacement = document.querySelector(`script[src="${src}"]`)

      expect(replacement).not.toBeNull()
      expect(replacement).not.toBe(failed)
    })
    document.querySelector(`script[src="${src}"]`)!.dispatchEvent(new Event('load'))
    await vi.waitFor(() => expect(wrapper.get('.loaded').text()).toBe('true'))
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
