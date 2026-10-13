import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StirPdfViewer from '../../../layers/theme/app/pdf/StirPdfViewer.client.vue'

// vue-pdf-viewer-core names its regions from `title`; the stub records what
// the wrapper hands it.
const PdfViewer = defineComponent({
  props: { src: { type: String, default: '' }, title: { type: String, default: undefined } },
  setup: props => () => h('div', { 'class': 'lpv-root', 'data-title': props.title }),
})

const mountViewer = (props: Record<string, unknown>) =>
  mountSuspended(StirPdfViewer, { props, global: { stubs: { PdfViewer } } })

describe('StirPdfViewer (Nuxt runtime)', () => {
  it('passes the document title so the library can name each viewer uniquely', async () => {
    const wrapper = await mountViewer({ src: '/a.pdf', title: 'Floor plan – 2nd Floor' })

    expect(wrapper.get('.lpv-root').attributes('data-title')).toBe('Floor plan – 2nd Floor')
  })

  it('offsets the sticky toolbar below the header unless the site overrides it', async () => {
    const wrapper = await mountViewer({ class: '[--stir-pdf-toolbar-offset:0px]', src: '/a.pdf' })
    const classes = wrapper.get('.lpv-root').classes()

    expect(classes).toContain('[--stir-pdf-toolbar-offset:0px]')
    expect(classes.some(name => name.startsWith('[--lpv-toolbar-offset:var(--stir-pdf-toolbar-offset,'))).toBe(true)
  })

  it('renders nothing without a source', async () => {
    const wrapper = await mountViewer({ title: 'Floor plan' })

    expect(wrapper.find('.lpv-root').exists()).toBe(false)
  })
})
