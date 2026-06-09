import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import RegionArea from '../../../layers/theme/app/components/RegionArea.vue'

const state = vi.hoisted(() => ({
  layoutBlockCalls: 0,
  page: {
    value: {} as Record<string, unknown>,
  },
}))

mockNuxtImport('useDrupalCe', () => {
  return () => ({
    getPage: () => state.page,
    renderCustomElements: () => ({
      template: '<div class="rendered-region" />',
    }),
  })
})

describe('RegionArea layout context fallback', () => {
  let unregisterEndpoint: (() => void) | undefined

  beforeEach(() => {
    state.layoutBlockCalls = 0
    state.page.value = {}
    unregisterEndpoint?.()
    unregisterEndpoint = registerEndpoint('/api/layout-blocks', () => {
      state.layoutBlockCalls++

      return {
        blocks: {
          top: [
            {
              element: 'paragraph-text',
              props: { id: 'fallback-region' },
            },
          ],
        },
      }
    })
  })

  afterEach(() => {
    unregisterEndpoint?.()
    unregisterEndpoint = undefined
  })

  it('does not request layout blocks when the CE page includes a blocks payload', async () => {
    state.page.value = {
      blocks: {
        top: [
          {
            element: 'paragraph-text',
            props: { id: 'ce-region' },
          },
        ],
      },
    }

    await mountSuspended(RegionArea, {
      props: {
        area: 'top',
      },
    })

    expect(state.layoutBlockCalls).toBe(0)
  })

  it('requests layout blocks when the CE page has no blocks payload', async () => {
    await mountSuspended(RegionArea, {
      props: {
        area: 'top',
      },
    })

    expect(state.layoutBlockCalls).toBe(1)
  })

  it('dedupes concurrent layout block fallback requests for the route', async () => {
    const MultipleRegions = defineComponent({
      components: { RegionArea },
      template: `
        <RegionArea area="top" />
        <RegionArea area="footer" />
      `,
    })

    await mountSuspended(MultipleRegions)

    expect(state.layoutBlockCalls).toBe(1)
  })
})
