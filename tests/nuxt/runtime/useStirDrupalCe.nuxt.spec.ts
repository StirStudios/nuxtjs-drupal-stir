import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useStirDrupalCe } from '../../../layers/theme/app/composables/useStirDrupalCe'

const state = vi.hoisted(() => ({
  renderedContent: undefined as unknown,
}))

mockNuxtImport('useDrupalCe', () => {
  return () => ({
    getPage: () => ({ value: {} }),
    resolveCustomElement: (element: string) =>
      element === 'node-page' || element === 'stir-missing-component'
        ? element
        : null,
    renderCustomElements: (content: unknown) => {
      state.renderedContent = content

      return h('div')
    },
    renderCustomElementsToVNodes: (content: unknown) => {
      state.renderedContent = content

      return [h('div')]
    },
  })
})

const Harness = defineComponent({
  setup() {
    const { getPage, renderCustomElements } = useStirDrupalCe()

    renderCustomElements({
      element: 'node-page',
      props: {},
      slots: {
        body: [{ element: 'field-unmapped', props: {}, slots: {} }],
      },
    })

    return () => h('div', String(Boolean(getPage())))
  },
})

describe('useStirDrupalCe (Nuxt runtime)', () => {
  it('preserves upstream methods and delegates rendering', async () => {
    await mountSuspended(Harness)

    expect(state.renderedContent).toMatchObject({
      element: 'node-page',
      slots: {
        body: [{
          element: 'field-unmapped',
          props: {},
        }],
      },
    })
  })
})
