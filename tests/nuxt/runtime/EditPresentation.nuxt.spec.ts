import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { readBody } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EditPresentation from '../../../layers/editorial/app/components/Edit/Presentation.vue'
import { pageRefreshKey } from '../../../layers/theme/app/utils/pageRefresh'

const popoverStub = defineComponent({
  props: {
    content: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['update:open'],
  template: '<div><button data-open-popover @click="$emit(\'update:open\', true)" /><slot /><div data-popover-content><slot name="content" /></div></div>',
})

const tooltipStub = defineComponent({
  template: '<span><slot /></span>',
})

const buttonStub = defineComponent({
  props: {
    label: {
      type: String,
      default: '',
    },
  },
  template: '<button>{{ label }}<slot /></button>',
})

const cardStub = defineComponent({
  template: '<section><slot name="header" /><slot /><slot name="footer" /></section>',
})

describe('EditPresentation focus management', () => {
  let unregisterEndpoint: (() => void) | undefined

  afterEach(() => {
    unregisterEndpoint?.()
    unregisterEndpoint = undefined
  })

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

  it('summarizes the active layout in a closed collapsible', async () => {
    unregisterEndpoint = registerEndpoint('/api/paragraph/42/presentation', () => ({
      ok: true,
      paragraphId: 42,
      bundle: 'layout',
      fields: [],
      layout: {
        current: 'layout_twocol_section',
        ownerRevisionId: 7,
        children: [],
        options: [{
          value: 'layout_twocol_section',
          label: 'Two column',
          defaultRegion: 'first',
          regions: [
            { value: 'first', label: 'First' },
            { value: 'second', label: 'Second' },
          ],
          iconMap: [['first', 'second']],
          moves: [],
        }],
      },
    }))

    const wrapper = await mountSuspended(EditPresentation, {
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

    await wrapper.get('[data-open-popover]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Layout · Two column')
    expect(wrapper.find('[data-slot="content"]').attributes('data-state')).toBe('closed')
  })

  it('saves only changed settings with the pending layout and refreshes the page', async () => {
    const layoutOption = (value: string, label: string, moves: object[] = []) => ({
      value,
      label,
      defaultRegion: 'first',
      regions: [{ value: 'first', label: 'First' }],
      iconMap: [['first']],
      moves,
    })
    const presentation = {
      ok: true,
      paragraphId: 42,
      bundle: 'layout',
      fields: [
        { key: 'hide_title', fieldName: 'field_hide_title', label: 'Hide title', type: 'boolean', value: false },
        { key: 'spacing', fieldName: 'field_spacing', label: 'Spacing', type: 'select', value: 'md', options: [] },
      ],
      layout: {
        current: 'layout_twocol_section',
        ownerRevisionId: 7,
        options: [
          layoutOption('layout_twocol_section', 'Two column'),
          layoutOption('layout_onecol', 'One column', [
            { source: 'second', sourceLabel: 'Second', count: 1, suggestedDestination: 'first' },
          ]),
        ],
      },
    }
    const posted: unknown[] = []
    const refresh = vi.fn(async () => {})

    unregisterEndpoint = registerEndpoint('/api/paragraph/42/presentation', async (event) => {
      if (event.method === 'POST') posted.push(await readBody(event))

      return presentation
    })

    const wrapper = await mountSuspended(EditPresentation, {
      global: {
        provide: { [pageRefreshKey]: refresh },
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

    await wrapper.get('[data-open-popover]').trigger('click')
    await flushPromises()

    wrapper.findComponent({ name: 'EditPresentationFields' }).vm.$emit('update', 'hide_title', true)
    wrapper.findComponent({ name: 'EditPresentationLayout' }).vm.$emit('select', 'layout_onecol')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(button => button.text() === 'Save changes')

    expect(saveButton?.attributes('disabled')).toBeUndefined()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(posted).toEqual([{
      values: { hide_title: true },
      layout: {
        target: 'layout_onecol',
        mappings: { second: 'first' },
        expectedOwnerRevisionId: 7,
      },
    }])
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(wrapper.text()).toContain('Saved')
  })
})
