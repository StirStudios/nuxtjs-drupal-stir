import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, h, inject, provide } from 'vue'
import ParagraphLayout from '../../../layers/theme/app/components/global/Paragraph/Layout.vue'
import ParagraphMedia from '../../../layers/theme/app/components/global/Paragraph/Media.vue'
import { fullBleedParagraphsKey } from '../../../layers/theme/app/utils/imageDelivery'

const EdgeToEdge = (uuids: string[]) => defineComponent({
  setup(_, { slots }) {
    provide(fullBleedParagraphsKey, computed(() => new Set(uuids)))

    return () => slots.default?.()
  },
})

const FullBleedProbe = defineComponent({
  props: ['uuid'],
  setup(props) {
    const uuids = inject(fullBleedParagraphsKey)

    return () => h('span', {
      class: 'probe',
      'data-full-bleed': String(Boolean(uuids?.value.has(props.uuid))),
    })
  },
})

const Item = defineComponent({
  props: ['node', 'deliveryProfile'],
  setup: props => () => h('span', { class: 'item', 'data-profile': props.deliveryProfile }),
})

async function mediaProfile(uuids: string[], props: Record<string, unknown>) {
  const wrapper = await mountSuspended(EdgeToEdge(uuids), {
    slots: {
      default: () => h(ParagraphMedia, props, {
        media: () => [h('div', { mid: 'image', type: 'image' })],
      }),
    },
    global: { stubs: { MediaItem: Item } },
  })
  const profile = wrapper.find('.item').attributes('data-profile')

  wrapper.unmount()
  return profile
}

describe('full-bleed media', () => {
  it('sizes a widthless edge-to-edge Media to the viewport', async () => {
    expect(await mediaProfile(['media'], { uuid: 'media' })).toBe('full')
  })

  it('keeps the container profile when the Media is not edge to edge', async () => {
    expect(await mediaProfile(['other'], { uuid: 'media' })).toBe('container')
    expect(await mediaProfile(['media'], { uuid: 'media', width: 'max-w-3xl' })).toBe('container')
    expect(await mediaProfile(['media'], {
      uuid: 'media',
      gridItems: { columns: { default: 1, md: 2 } },
    })).toBe('split')
  })

  it.each([
    { container: false, width: undefined, expected: 'true' },
    { container: true, width: undefined, expected: 'false' },
    { container: false, width: 'max-w-3xl', expected: 'false' },
  ])('passes edge to edge to children for container=$container width=$width', async ({
    container,
    width,
    expected,
  }) => {
    const wrapper = await mountSuspended(EdgeToEdge(['layout']), {
      slots: {
        default: () => h(ParagraphLayout, {
          id: 'full-bleed-layout',
          uuid: 'layout',
          layout: 'one_column',
          container,
          width,
        }, { first: () => [h(FullBleedProbe, { uuid: 'child' })] }),
      },
    })

    expect(wrapper.find('.probe').attributes('data-full-bleed')).toBe(expected)
    wrapper.unmount()
  })

  it('does not pass edge to edge through a Layout that is itself contained', async () => {
    const wrapper = await mountSuspended(EdgeToEdge([]), {
      slots: {
        default: () => h(ParagraphLayout, {
          id: 'nested-layout',
          uuid: 'layout',
          layout: 'one_column',
          container: false,
        }, { first: () => [h(FullBleedProbe, { uuid: 'child' })] }),
      },
    })

    expect(wrapper.find('.probe').attributes('data-full-bleed')).toBe('false')
    wrapper.unmount()
  })
})
