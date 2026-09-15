import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { usePopupData } from '../../../layers/integrations/app/composables/usePopupData'

const state = vi.hoisted(() => ({
  page: { value: {} as Record<string, unknown> },
  appContextBlocks: undefined as Record<string, unknown> | undefined,
}))

mockNuxtImport('useStirDrupalCe', () => () => ({ getPage: () => state.page }))
mockNuxtImport('useAppContext', () => () => ({
  data: ref(state.appContextBlocks ? { blocks: state.appContextBlocks } : null),
  status: ref('success'),
  execute: vi.fn(),
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

  it('reads popups from the page popups region', async () => {
    state.page.value = { blocks: { popups: popupBlock('popups-region') } }

    expect(await resolvePopupUuid()).toBe('popups-region')
  })

  it('falls back to the legacy decoupled region from unmigrated producers', async () => {
    state.page.value = { blocks: { decoupled: popupBlock('legacy-region') } }

    expect(await resolvePopupUuid()).toBe('legacy-region')
  })

  it('prefers the popups region when both regions are present', async () => {
    state.page.value = {
      blocks: { popups: popupBlock('popups-region'), decoupled: popupBlock('legacy-region') },
    }

    expect(await resolvePopupUuid()).toBe('popups-region')
  })

  it('reads the popups region from app context when the page has no blocks', async () => {
    state.appContextBlocks = { popups: popupBlock('app-context-region') }

    expect(await resolvePopupUuid()).toBe('app-context-region')
  })
})
