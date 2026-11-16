import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, h, inject, provide } from 'vue'
import ParagraphLayout from '../../../layers/theme/app/components/global/Paragraph/Layout.vue'
import ParagraphMedia from '../../../layers/theme/app/components/global/Paragraph/Media.vue'
import { imageSlotKey, viewportSlot } from '../../../layers/theme/app/utils/imageDelivery'

// A page renders its paragraphs edge to edge (NodeDisplay provides the viewport).
const Page = defineComponent({
  setup(_, { slots }) {
    provide(imageSlotKey, computed(() => viewportSlot))

    return () => slots.default?.()
  },
})

// Reports the width its slot gives at a 1400px viewport.
const SlotProbe = defineComponent({
  setup() {
    const slot = inject(imageSlotKey)

    return () => h('span', { class: 'probe', 'data-width': String(slot?.value(1400)) })
  },
})

async function widthAt1400(content: () => ReturnType<typeof h>) {
  const wrapper = await mountSuspended(Page, {
    slots: { default: content },
    global: { stubs: { MediaItem: SlotProbe, LazyMediaItem: SlotProbe } },
  })
  const widths = wrapper.findAll('.probe').map(probe => Number(probe.attributes('data-width')))

  wrapper.unmount()
  return widths
}

const layout = (props: Record<string, unknown>, regions: Record<string, () => unknown>) =>
  h(ParagraphLayout, { id: 'slots', uuid: 'layout', layout: 'one_column', ...props }, regions)

describe('image slots through layouts', () => {
  it('keeps an edge-to-edge Media at the viewport width', async () => {
    expect(await widthAt1400(() => h(ParagraphMedia, { uuid: 'media' }, {
      media: () => [h('div', { mid: 'image', type: 'image' })],
    }))).toEqual([1400])
  })

  it('narrows to the theme container inside a contained Layout', async () => {
    expect(await widthAt1400(() => layout({ container: true }, {
      first: () => [h(SlotProbe)],
    }))).toEqual([1336])
  })

  it('caps a region at the Layout\'s Width field', async () => {
    expect(await widthAt1400(() => layout({ container: true, width: 'md' }, {
      first: () => [h(SlotProbe)],
    }))).toEqual([768])
  })

  it('gives each region of an 8/4 Layout its column and full-span regions the whole grid', async () => {
    expect(await widthAt1400(() => layout({
      container: true,
      layout: 'two_column_8_4',
      gridClass: { columns: { lg: '[8fr_4fr]' }, gap: { lg: 6 } },
    }, {
      top: () => [h(SlotProbe)],
      first: () => [h(SlotProbe)],
      second: () => [h(SlotProbe)],
    }))).toEqual([1336, ((1336 - 24) * 8) / 12, ((1336 - 24) * 4) / 12])
  })

  it('composes a gallery grid inside a Layout column', async () => {
    expect(await widthAt1400(() => layout({
      container: true,
      layout: 'two_column',
      gridClass: { columns: { md: 2 }, gap: { md: 8 } },
    }, {
      first: () => [h(ParagraphMedia, { uuid: 'gallery', gridItems: { columns: { lg: 3 }, gap: { lg: 4 } } }, {
        media: () => [h('div', { mid: 'a', type: 'image' }), h('div', { mid: 'b', type: 'image' })],
      })],
    }))).toEqual([((1336 - 32) / 2 - 32) / 3, ((1336 - 32) / 2 - 32) / 3])
  })
})
