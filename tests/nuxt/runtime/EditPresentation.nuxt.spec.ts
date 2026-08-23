import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import EditPresentation from '../../../layers/editorial/app/components/Edit/Presentation.vue'

const popoverStub = defineComponent({
  props: {
    content: {
      type: Object,
      default: () => ({}),
    },
  },
  template: '<div><slot /><div data-popover-content><slot name="content" /></div></div>',
})

const tooltipStub = defineComponent({
  template: '<span><slot /></span>',
})

const buttonStub = defineComponent({
  template: '<button><slot /></button>',
})

const cardStub = defineComponent({
  template: '<section><slot name="header" /><slot /><slot name="footer" /></section>',
})

describe('EditPresentation focus management', () => {
  it('focuses the heading instead of automatically opening the first field tooltip', async () => {
    const wrapper = await mountSuspended(EditPresentation, {
      attachTo: document.body,
      global: {
        stubs: {
          UButton: buttonStub,
          UCard: cardStub,
          UPopover: popoverStub,
          UTooltip: tooltipStub,
        },
      },
      props: {
        action: {
          key: 'presentation',
          ariaLabel: 'Quick settings',
          tooltip: 'Quick settings',
          icon: 'i-lucide-settings',
          buttonClass: '',
          paragraphId: 42,
          variant: 'soft',
        },
      },
    })
    const preventDefault = vi.fn()
    const content = wrapper.findComponent(popoverStub).props('content') as {
      onOpenAutoFocus: (event: Event) => void
    }

    content.onOpenAutoFocus({ preventDefault } as unknown as Event)
    await nextTick()

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(wrapper.get('h2').element)

    wrapper.unmount()
  })
})
