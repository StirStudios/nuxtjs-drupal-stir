import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import RegionArea from '../../../layers/theme/app/components/RegionArea.vue'

const state = vi.hoisted(() => ({
  layoutBlockCalls: 0,
  renderedBlocks: [] as unknown[],
  appContextBlocks: {
    top: [
      {
        element: 'paragraph-text',
        props: { id: 'app-context-region' },
      },
    ],
  } as Record<string, unknown[]>,
  page: {
    value: {} as Record<string, unknown>,
  },
}))

mockNuxtImport('useDrupalCe', () => {
  return () => ({
    getPage: () => state.page,
    renderCustomElements: (blocks: unknown) => {
      state.renderedBlocks = Array.isArray(blocks) ? blocks : []

      return {
        template: '<div class="rendered-region" />',
      }
    },
  })
})

describe('RegionArea app context fallback', () => {
  let unregisterEndpoint: (() => void) | undefined

  beforeEach(() => {
    state.layoutBlockCalls = 0
    state.renderedBlocks = []
    state.appContextBlocks = {
      top: [
        {
          element: 'paragraph-text',
          props: { id: 'app-context-region' },
        },
      ],
    }
    state.page.value = {}
    unregisterEndpoint?.()
    unregisterEndpoint = registerEndpoint('/api/app-context', () => {
      state.layoutBlockCalls++

      return {
        blocks: state.appContextBlocks,
      }
    })
  })

  afterEach(() => {
    unregisterEndpoint?.()
    unregisterEndpoint = undefined
  })

  it('requests and prefers app context blocks when the CE page includes a blocks payload', async () => {
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

    expect(state.layoutBlockCalls).toBe(1)
    expect(state.renderedBlocks).toEqual([
      {
        element: 'paragraph-text',
        props: { id: 'app-context-region' },
      },
    ])
  })

  it('falls back to CE page blocks when app context has no blocks for the area', async () => {
    state.appContextBlocks = {}
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

    expect(state.layoutBlockCalls).toBe(1)
    expect(state.renderedBlocks).toEqual([
      {
        element: 'paragraph-text',
        props: { id: 'ce-region' },
      },
    ])
  })

  it('dedupes concurrent layout block requests for the route', async () => {
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
