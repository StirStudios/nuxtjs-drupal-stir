import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { usePopupData } from '../../../layers/integrations/app/composables/usePopupData'

const state = vi.hoisted(() => ({
  page: { value: {} as Record<string, unknown> },
  appContextBlocks: undefined as Record<string, unknown> | undefined,
}))

mockNuxtImport('useStirDrupalCe', () => () => ({ getPage: () => state.page }))
mockNuxtImport('useAppRegionBlocks', () => (area: string) => ({
  data: ref(state.appContextBlocks?.[area]),
}))

const popupBlock = (uuid: string) => [{
  element: 'block-content-paragraph',
  props: { id: uuid },
  slots: {
    paragraphBlock: [{ element: 'paragraph-popup', props: { uuid } }],
  },
}]

async function resolvePopupUuid(): Promise<unknown> {
  let popup: ReturnType<typeof usePopupData>['popup'] | undefined
  const Harness = defineComponent({
    setup() {
      popup = usePopupData().popup

      return () => null
    },
  })
  const wrapper = await mountSuspended(Harness)
  const uuid = popup?.value?.props?.uuid

  wrapper.unmount()

  return uuid
}

describe('usePopupData', () => {
  beforeEach(() => {
    state.page.value = {}
    state.appContextBlocks = undefined
  })

  it('reads the popups region Drupal rendered for this path', async () => {
    state.appContextBlocks = { popups: popupBlock('app-context-region') }

    expect(await resolvePopupUuid()).toBe('app-context-region')
  })

  it('falls back to a popup placed in the page content', async () => {
    state.page.value = { content: popupBlock('in-content')[0]?.slots.paragraphBlock }

    expect(await resolvePopupUuid()).toBe('in-content')
  })
})
