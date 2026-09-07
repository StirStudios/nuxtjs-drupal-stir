import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { clearNuxtData } from '#app'
import { flushPromises } from '@vue/test-utils'
import { useAppRegionBlocks } from '../../../layers/theme/app/composables/useAppContext'
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
  const wrappers: Array<{ unmount: () => void }> = []

  beforeEach(() => {
    clearNuxtData()
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
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    clearNuxtData()
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

    const wrapper = await mountSuspended(RegionArea, {
      props: {
        area: 'top',
      },
    })

    wrappers.push(wrapper)
    await vi.waitFor(() => expect(state.layoutBlockCalls).toBe(1))
    await flushPromises()
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

    const wrapper = await mountSuspended(RegionArea, {
      props: {
        area: 'top',
      },
    })

    wrappers.push(wrapper)
    await vi.waitFor(() => expect(state.layoutBlockCalls).toBe(1))
    await flushPromises()
    expect(state.layoutBlockCalls).toBe(1)
    expect(state.renderedBlocks).toEqual([
      {
        element: 'paragraph-text',
        props: { id: 'ce-region' },
      },
    ])
  })

  it.each(['preferred', 'empty', 'error'] as const)(
    'does not initialize CE fallback while uncached context is pending (%s)',
    async (outcome) => {
      const fallback = [{ element: 'paragraph-text', props: { id: 'ce-region' } }]

      state.page.value = { blocks: { top: fallback } }
      let release!: () => void
      const pending = new Promise<void>((resolve) => { release = resolve })

      unregisterEndpoint?.()
      unregisterEndpoint = registerEndpoint('/api/app-context', async () => {
        state.layoutBlockCalls++
        await pending
        if (outcome === 'error') return new Response('Unavailable', { status: 400 })
        return { blocks: outcome === 'preferred' ? state.appContextBlocks : {} }
      })

      const wrapper = await mountSuspended(RegionArea, { props: { area: 'top' } })

      wrappers.push(wrapper)
      try {
        await vi.waitFor(() => expect(state.layoutBlockCalls).toBe(1))
        expect(state.renderedBlocks).toEqual([])
        expect(wrapper.find('.rendered-region').exists()).toBe(false)
      } finally {
        release()
      }
      await vi.waitFor(() => expect(state.renderedBlocks).toEqual(
        outcome === 'preferred' ? state.appContextBlocks.top : fallback,
      ))
      expect(state.layoutBlockCalls).toBe(1)
    },
  )

  it('handles a failed shared request and permits a successful retry', async () => {
    unregisterEndpoint?.()
    let fail = true

    unregisterEndpoint = registerEndpoint('/api/app-context', () => {
      state.layoutBlockCalls++
      if (fail) throw new Error('fixture unavailable')
      return { blocks: { test: [{ element: 'paragraph-text' }] } }
    })
    const Harness = defineComponent({
      async setup() {
        const result = await useAppRegionBlocks('test')

        return { result }
      },
      template: '<div />',
    })
    const wrapper = await mountSuspended(Harness)

    expect(wrapper.vm.result.error.value).toBeTruthy()
    fail = false
    await wrapper.vm.result.refresh()
    expect(wrapper.vm.result.error.value).toBeFalsy()
    expect(wrapper.vm.result.data.value).toEqual([{ element: 'paragraph-text' }])
    wrapper.unmount()
  })

  it('dedupes concurrent layout block requests for the route', async () => {
    const MultipleRegions = defineComponent({
      components: { RegionArea },
      template: `
        <RegionArea area="top" />
        <RegionArea area="footer" />
      `,
    })

    wrappers.push(await mountSuspended(MultipleRegions))

    await vi.waitFor(() => expect(state.layoutBlockCalls).toBe(1))
  })
})
