import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParagraphButton from '../../../layers/theme/app/components/global/Paragraph/Button.vue'

function mountPdfButton(linkTitle: string) {
  return mountSuspended(ParagraphButton, {
    props: { link: { title: linkTitle } },
    slots: {
      media: () => h('div', { type: 'document', url: '/files/catering.pdf', title: 'Catering menu' }),
    },
  })
}

describe('Paragraph Button (Nuxt runtime)', () => {
  it('labels a document button with the editor\'s link text', async () => {
    const wrapper = await mountPdfButton('Menu')

    expect(wrapper.get('a').text()).toBe('Menu')
  })

  it('links to the document in a new tab while the PDF viewer is off', async () => {
    const link = (await mountPdfButton('Menu')).get('a')

    expect(link.attributes('href')).toBe('/files/catering.pdf')
    expect(link.attributes('target')).toBe('_blank')
  })

  it('falls back to the document\'s title when the link text is empty', async () => {
    const wrapper = await mountPdfButton('  ')

    expect(wrapper.get('a').text()).toBe('Catering menu')
  })

  const video = { type: 'video', mid: 7, title: 'Showreel', src: 'https://www.example.com/reel.mp4' }
  // Records what the Button hands the shared media modal.
  const MediaModalStub = defineComponent({
    props: { open: Boolean, items: { type: Array, default: () => [] } },
    emits: ['update:open'],
    setup: props => () => h('div', { 'data-modal': props.open ? 'open' : 'closed', 'data-title': (props.items[0] as { title?: string } | undefined)?.title }),
  })

  function mountVideoButton(link: Record<string, unknown> = {}, icon?: string) {
    return mountSuspended(ParagraphButton, {
      props: { link, icon },
      slots: { media: () => h('div', video) },
      global: { stubs: { ParagraphMediaModal: MediaModalStub } },
    })
  }

  it('opens an attached video in the media modal, named as a video', async () => {
    const wrapper = await mountVideoButton({ title: 'Watch the reel', url: '/reel' })
    const button = wrapper.get('button')

    expect(button.text()).toBe('Watch the reel')
    expect(button.attributes('aria-label')).toBe('Watch the reel, opens video')
    expect(button.attributes('aria-haspopup')).toBe('dialog')
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.get('[data-modal]').attributes()).toMatchObject({ 'data-modal': 'closed', 'data-title': 'Showreel' })

    await button.trigger('click')

    expect(wrapper.get('[data-modal]').attributes('data-modal')).toBe('open')
  })

  it('labels a video button with the video title and a play icon by default', async () => {
    const wrapper = await mountVideoButton()

    expect(wrapper.get('button').text()).toBe('Showreel')
    expect(wrapper.html()).toContain('lucide:play')
  })

  it('keeps an editor\'s icon on a video button', async () => {
    const wrapper = await mountVideoButton({}, 'i-lucide-film')

    expect(wrapper.html()).toContain('lucide:film')
    expect(wrapper.html()).not.toContain('lucide:play')
  })

  it('keeps a document button when a video is attached as well', async () => {
    const wrapper = await mountSuspended(ParagraphButton, {
      props: { link: { title: 'Menu' } },
      slots: {
        media: () => [
          h('div', { type: 'document', url: '/files/catering.pdf', title: 'Catering menu' }),
          h('div', video),
        ],
      },
      global: { stubs: { ParagraphMediaModal: MediaModalStub } },
    })

    expect(wrapper.get('a').attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('[data-modal]').exists()).toBe(false)
  })

  it('stays a plain link without media', async () => {
    const wrapper = await mountSuspended(ParagraphButton, { props: { link: { title: 'About', url: '/about' } } })

    expect(wrapper.get('a').attributes('href')).toBe('/about')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('returns focus to the button when the video modal closes', async () => {
    const wrapper = await mountSuspended(ParagraphButton, {
      props: { link: { title: 'Watch the reel' } },
      slots: { media: () => h('div', video) },
      attachTo: document.body,
    })
    const button = wrapper.get('button').element as HTMLButtonElement

    button.focus()
    button.click()
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 50))

    const dialog = document.querySelector('[role="dialog"]')

    expect(dialog).not.toBeNull()
    expect(dialog!.contains(document.activeElement)).toBe(true)

    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(document.activeElement).toBe(button)
  })

  it('plays a hero Button\'s video in the framed modal, not as a hero background', async () => {
    const seen: unknown[] = []
    const MediaVideoStub = defineComponent({
      props: { isHero: { type: Boolean, default: undefined } },
      setup: (props) => {
        seen.push(props.isHero)
        return () => h('div', { 'data-video': '' })
      },
    })
    const InHero = defineComponent({
      setup: () => {
        provide('isHero', true)
        return () => h(ParagraphButton, { link: { title: 'Watch the reel' } }, { media: () => h('div', video) })
      },
    })
    const wrapper = await mountSuspended(InHero, {
      attachTo: document.body,
      global: { stubs: { MediaVideo: MediaVideoStub } },
    })

    await wrapper.get('button').trigger('click')
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(document.querySelector('[data-video]')).not.toBeNull()
    expect(seen.at(-1)).toBe(false)
    wrapper.unmount()
  })
})
