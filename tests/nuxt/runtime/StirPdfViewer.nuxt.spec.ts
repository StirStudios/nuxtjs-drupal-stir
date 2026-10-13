import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StirPdfViewer from '../../../layers/theme/app/pdf/StirPdfViewer.client.vue'

// Mirrors vue-pdf-viewer-core's markup: a root wrapping a toolbar whose
// accessible name is hardcoded.
const PdfViewer = defineComponent({
  props: { src: { type: String, default: '' } },
  setup: () => () => h('div', { class: 'lpv-root' }, [
    h('div', { 'aria-label': 'PDF viewer toolbar', class: 'lpv-toolbar', role: 'toolbar' }),
  ]),
})

const mountViewer = (props: Record<string, unknown>) =>
  mountSuspended(StirPdfViewer, { props, global: { stubs: { PdfViewer } } })

describe('StirPdfViewer (Nuxt runtime)', () => {
  it('names the toolbar after the document so several viewers can be told apart', async () => {
    const first = await mountViewer({ src: '/a.pdf', title: 'Floor plan – 2nd Floor' })
    const second = await mountViewer({ src: '/b.pdf', title: 'Floor plan – 3rd Floor' })

    expect(first.get('[role="toolbar"]').attributes('aria-label')).toBe('Floor plan – 2nd Floor toolbar')
    expect(second.get('[role="toolbar"]').attributes('aria-label')).toBe('Floor plan – 3rd Floor toolbar')
  })

  it('keeps the library name when the title is blank', async () => {
    const wrapper = await mountViewer({ src: '/a.pdf', title: '  ' })

    expect(wrapper.get('[role="toolbar"]').attributes('aria-label')).toBe('PDF viewer toolbar')
  })

  it('passes attributes such as the toolbar offset override to the viewer root', async () => {
    const wrapper = await mountViewer({ class: '[--stir-pdf-toolbar-offset:0px]', src: '/a.pdf' })

    expect(wrapper.get('.lpv-root').classes()).toContain('[--stir-pdf-toolbar-offset:0px]')
  })
})
