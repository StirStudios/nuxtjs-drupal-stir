import { defineComponent, h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ParagraphMedia from '../../../layers/theme/app/components/global/Paragraph/Media.vue'

const Item = defineComponent({
  props: ['node', 'index', 'wrapperClass'],
  emits: ['open'],
  setup: (props, { emit }) => () => h('button', {
    'data-media-id': props.node.props.mid,
    'data-height': props.wrapperClass,
    'onClick': () => emit('open', props.index),
  }, props.node.props.mid),
})
const Modal = defineComponent({
  props: ['items', 'activeIndex', 'open'],
  setup: props => () => h('output', {
    'data-open': String(props.open),
    'data-active': props.items[props.activeIndex]?.mid,
  }, props.items.map((item: { mid: string }) => item.mid).join(',')),
})

describe('Drupal media ordering', () => {
  // Section headings belong to the Layout paragraph.
  it('ignores a legacy section heading without leaking it as an attribute', async () => {
    const wrapper = await mountSuspended(ParagraphMedia, {
      props: { header: 'Project gallery', headerTag: 'h2' },
      slots: { media: () => [h('div', { mid: 'image', type: 'image' })] },
      global: { stubs: { MediaItem: Item, ParagraphMediaModal: Modal } },
    })

    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Project gallery')
    expect(wrapper.find('[header]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('passes the Small preset to image and video previews', async () => {
    const wrapper = await mountSuspended(ParagraphMedia, {
      props: { mediaHeight: 'small', overlay: true },
      slots: { media: () => ['image', 'video'].map(type => h('div', { mid: type, type })) },
      global: { stubs: { MediaItem: Item, ParagraphMediaModal: Modal } },
    })

    expect(wrapper.findAll('[data-media-id]').map(item => item.attributes('data-height')))
      .toEqual(['h-[clamp(12rem,22vw,18rem)]', 'h-[clamp(12rem,22vw,18rem)]'])
    wrapper.unmount()
  })

  it('preserves supplied order and opens the matching modal item', async () => {
    const wrapper = await mountSuspended(ParagraphMedia, {
      props: { overlay: true },
      slots: {
        media: () => ['third', 'first', 'second'].map(mid => h('div', { mid, type: 'audio' })),
      },
      global: { stubs: { MediaItem: Item, ParagraphMediaModal: Modal } },
    })

    await nextTick()
    expect(wrapper.findAll('[data-media-id]').map(item => item.attributes('data-media-id')))
      .toEqual(['third', 'first', 'second'])
    await wrapper.get('[data-media-id="first"]').trigger('click')
    expect(wrapper.get('output').text()).toBe('third,first,second')
    expect(wrapper.get('output').attributes('data-active')).toBe('first')
    expect(wrapper.get('output').attributes('data-open')).toBe('true')
    wrapper.unmount()
  })
})
