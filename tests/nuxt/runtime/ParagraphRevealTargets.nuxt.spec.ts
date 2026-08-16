import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import ParagraphButton from '../../../layers/theme/app/components/global/Paragraph/Button.vue'
import ParagraphInstagramFeed from '../../../layers/theme/app/components/global/Paragraph/InstagramFeed.vue'
import ParagraphTabs from '../../../layers/theme/app/components/global/Paragraph/Tabs.vue'
import ParagraphReveal from '../../../layers/theme/app/components/ParagraphReveal.vue'
import { provideRevealMotionScope } from '../../../layers/theme/app/composables/useRevealMotionScope'

const PageRevealScope = defineComponent({
  props: {
    component: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    provideRevealMotionScope(() => 'fade-up', { stagger: true })

    return () => h(props.component, {
      id: 1,
      link: {
        title: 'Purchase',
        url: '/purchase',
      },
    }, {
      content: () => h('div', { class: 'view-content' }, 'View content'),
      media: () => h('article', { class: 'instagram-card' }, 'Instagram card'),
    })
  },
})

describe('paragraph reveal targets (Nuxt runtime)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('applies inherited page reveal motion to button paragraphs', async () => {
    const wrapper = await mountSuspended(PageRevealScope, {
      props: { component: ParagraphButton },
    })

    expect(wrapper.find('a[href="/purchase"]').exists()).toBe(true)
    expect(wrapper.find('[style*="opacity"]').exists()).toBe(true)
  })

  it('applies inherited page reveal motion to Instagram feed paragraphs', async () => {
    const wrapper = await mountSuspended(PageRevealScope, {
      props: { component: ParagraphInstagramFeed },
    })

    expect(wrapper.find('.instagram-card').exists()).toBe(true)
    expect(wrapper.find('[style*="opacity"]').exists()).toBe(true)
  })

  it('reveals tabs as one unit without replaying motion in panel content', async () => {
    const TabsRevealScope = defineComponent({
      setup() {
        provideRevealMotionScope(() => 'fade-up')

        return () => h(ParagraphTabs, { id: 1 }, {
          tab: () => [
            h('div', { title: 'First' }, [
              h(ParagraphReveal, { id: 2 }, () =>
                h('p', { class: 'panel-content' }, 'First panel')),
            ]),
          ],
        })
      },
    })
    const wrapper = await mountSuspended(TabsRevealScope)

    expect(wrapper.find('.panel-content').exists()).toBe(true)
    expect(wrapper.findAll('[style*="opacity"]')).toHaveLength(1)
  })

  it('keeps explicitly disabled paragraph motion visible', async () => {
    const wrapper = await mountSuspended(ParagraphInstagramFeed, {
      props: {
        direction: 'none',
        id: 1,
      },
      slots: {
        media: () => h('article', { class: 'instagram-card' }, 'Instagram card'),
      },
    })

    expect(wrapper.find('.instagram-card').exists()).toBe(true)
    expect(wrapper.find('[style*="opacity"]').exists()).toBe(false)
  })

  it('keeps paragraph content visible when reduced motion is requested', async () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
      query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
    )
    const wrapper = await mountSuspended(ParagraphInstagramFeed, {
      props: {
        direction: 'fade-up',
        id: 1,
      },
      slots: {
        media: () => h('article', { class: 'instagram-card' }, 'Instagram card'),
      },
    })

    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(wrapper.find('.instagram-card').exists()).toBe(true)
    expect(wrapper.find('[style*="opacity"]').exists()).toBe(false)
  })
})
