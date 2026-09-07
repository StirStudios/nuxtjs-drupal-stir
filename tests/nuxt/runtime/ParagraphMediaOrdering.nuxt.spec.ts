import { defineComponent, h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ParagraphMedia from '../../../layers/theme/app/components/global/Paragraph/Media.vue'

const Item = defineComponent({
  props: ['node', 'index'],
  emits: ['open'],
  setup: (props, { emit }) => () => h('button', {
    'data-media-id': props.node.props.mid,
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
  it('preserves supplied order with a legacy randomize flag and opens the matching modal item', async () => {
    const wrapper = await mountSuspended(ParagraphMedia, {
      props: { randomize: true, overlay: true },
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
