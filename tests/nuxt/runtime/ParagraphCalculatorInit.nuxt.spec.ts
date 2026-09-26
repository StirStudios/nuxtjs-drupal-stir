import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import ParagraphCalculator from '../../../layers/theme/app/components/global/Paragraph/Calculator.vue'

// A repeat visit: the loader script is already loaded when the component sets
// up, before <ClientOnly> has rendered the widget element.
mockNuxtImport('useThirdPartyScript', () => () => ({ isLoaded: ref(true) }))

type PiperWindow = Window & { initPiperWidget?: () => void }

describe('ParagraphCalculator initialisation', () => {
  afterEach(() => {
    delete (window as PiperWindow).initPiperWidget
  })

  it('initialises the widget once its element exists when the loader is already loaded', async () => {
    const elementsSeen: number[] = []

    ;(window as PiperWindow).initPiperWidget = () => {
      elementsSeen.push(document.querySelectorAll('[data-piper-widget]').length)
    }

    const wrapper = await mountSuspended(ParagraphCalculator, {
      props: { venueId: '42', embedUrl: 'https://assets.piperavenue.com/widgets/piper-loader.js' },
      attachTo: document.body,
    })

    await nextTick()
    expect(elementsSeen.length).toBeGreaterThan(0)
    expect(elementsSeen.every(count => count > 0)).toBe(true)
    wrapper.unmount()
  })
})
