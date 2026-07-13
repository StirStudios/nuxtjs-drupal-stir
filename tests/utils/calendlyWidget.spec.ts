import { describe, expect, it } from 'vitest'
import {
  isCalendlyMessage,
  isCalendlyMessageForContainer,
  resolveCalendlyHeight,
  resolveCalendlyUrl,
} from '../../layers/theme/app/composables/useCalendlyWidget'

describe('Calendly widget messages', () => {
  it('accepts only HTTPS scheduling URLs on Calendly', () => {
    expect(resolveCalendlyUrl('https://calendly.com/stir/meeting')).toBe(
      'https://calendly.com/stir/meeting',
    )
    expect(resolveCalendlyUrl('http://calendly.com/stir/meeting')).toBe('')
    expect(resolveCalendlyUrl('https://calendly.com.example/stir')).toBe('')
  })

  it('accepts only Calendly messages from the official origin', () => {
    expect(isCalendlyMessage({
      origin: 'https://calendly.com',
      data: { event: 'calendly.page_height' },
    } as MessageEvent)).toBe(true)

    expect(isCalendlyMessage({
      origin: 'https://malicious.example',
      data: { event: 'calendly.page_height' },
    } as MessageEvent)).toBe(false)

    expect(isCalendlyMessage({
      origin: 'https://calendly.com',
      data: { event: 'calendly-lookalike' },
    } as MessageEvent)).toBe(false)
  })

  it('associates resize messages with the originating widget iframe', () => {
    const iframeSource = {} as Window
    const otherSource = {} as Window
    const container = {
      querySelector: () => ({ contentWindow: iframeSource }),
    } as unknown as HTMLElement

    expect(isCalendlyMessageForContainer({
      origin: 'https://calendly.com',
      source: iframeSource,
      data: { event: 'calendly.page_height' },
    } as MessageEvent, container)).toBe(true)
    expect(isCalendlyMessageForContainer({
      origin: 'https://calendly.com',
      source: otherSource,
      data: { event: 'calendly.page_height' },
    } as MessageEvent, container)).toBe(false)
  })

  it('clamps resize messages to safe dimensions', () => {
    expect(resolveCalendlyHeight('700')).toBe(700)
    expect(resolveCalendlyHeight(20)).toBe(320)
    expect(resolveCalendlyHeight('9000')).toBe(2000)
    expect(resolveCalendlyHeight('not-a-height')).toBeNull()
  })
})
