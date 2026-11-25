import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import { defineComponent, h } from 'vue'
import { useDrupalElements } from '../../../layers/theme/app/composables/useDrupalElements'

const render = (content: unknown) => mountSuspended(defineComponent({
  setup() {
    const { renderCustomElements } = useDrupalElements()

    return () => h('div', { id: 'root' }, [renderCustomElements(content as never)])
  },
}))

describe('useDrupalElements', () => {
  it('renders an element whose props Drupal sent as an empty PHP array', async () => {
    const wrapper = await render({ element: 'drupal-markup', props: [], slots: { default: 'Empty props' } })

    expect(wrapper.get('#root').text()).toContain('Empty props')
  })

  it('renders nothing for content without an element, as a redirect page sends', async () => {
    const wrapper = await render({ props: [], slots: { section: [] } })

    expect(wrapper.get('#root').text()).toBe('')
  })

  it('renders an unknown bundle through its Default fallback', async () => {
    const { resolveCustomElement } = useDrupalElements()

    expect(resolveCustomElement('paragraph-not-a-real-bundle')).toBe(resolveCustomElement('paragraph-default'))
  })

  it('fetches a menu through the layer\'s proxy', async () => {
    registerEndpoint('/api/menu/api/menu_items/elements-test', () => [{ title: 'From the proxy' }])

    const wrapper = await mountSuspended(defineComponent({
      async setup() {
        const { data } = await useDrupalElements().useMenu('elements-test')

        return () => h('p', data.value[0]?.title)
      },
    }))

    expect(wrapper.text()).toBe('From the proxy')
  })

  it('gives an empty menu when the fetch fails', async () => {
    registerEndpoint('/api/menu/api/menu_items/elements-missing', () => {
      throw createError({ statusCode: 404 })
    })

    const wrapper = await mountSuspended(defineComponent({
      async setup() {
        const { data, error } = await useDrupalElements().useMenu('elements-missing')

        return () => h('p', `${data.value.length} ${Boolean(error.value)}`)
      },
    }))

    expect(wrapper.text()).toBe('0 true')
  })
})
