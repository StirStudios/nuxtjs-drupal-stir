import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import ParagraphCalculator from '../../../layers/theme/app/components/global/Paragraph/Calculator.vue'

const loader = vi.hoisted(() => ({ src: '', options: undefined as Record<string, unknown> | undefined }))

mockNuxtImport('useThirdPartyScript', () => (src: string, options: Record<string, unknown>) => {
  loader.src = src
  loader.options = options

  return { isLoaded: { value: false } }
})

const configured = 'https://assets.example.com/widgets/loader.js'

describe('ParagraphCalculator (Nuxt runtime)', () => {
  // As a site's nuxt.config.ts sets it.
  beforeAll(() => {
    useRuntimeConfig().public.calculator.loaderUrl = configured
  })
  afterAll(() => {
    useRuntimeConfig().public.calculator.loaderUrl = ''
  })

  it('loads the widget from the site config, not from content', async () => {
    const wrapper = await mountSuspended(ParagraphCalculator, {
      props: { venueId: '42', embedUrl: 'https://editor-typed.example.com/other.js' },
    })
    const widget = wrapper.find('[data-piper-widget]')

    expect(loader.src).toBe(configured)
    expect(widget.attributes('data-piper-venue')).toBe('42')
    // The deprecated content field is never rendered.
    expect(wrapper.html()).not.toContain('editor-typed')
    wrapper.unmount()
  })

  it('allows only the configured loader host', async () => {
    const wrapper = await mountSuspended(ParagraphCalculator, { props: { venueId: '42' } })

    expect(loader.options?.allowedOrigins).toEqual(['https://assets.example.com'])
    wrapper.unmount()
  })
})
