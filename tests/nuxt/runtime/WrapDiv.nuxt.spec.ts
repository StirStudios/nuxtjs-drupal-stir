import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WrapDiv from '../../../app/components/Wrap/Div.vue'

describe('WrapDiv (Nuxt runtime)', () => {
  it('renders slot content without extra wrapper when styles is blank', async () => {
    const wrapper = await mountSuspended(WrapDiv, {
      props: {
        styles: '   ',
      },
      slots: {
        default: 'Hello',
      },
    })

    expect(wrapper.text()).toContain('Hello')
    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('renders wrapper when styles are provided', async () => {
    const wrapper = await mountSuspended(WrapDiv, {
      props: {
        styles: 'test-class',
      },
      slots: {
        default: 'Wrapped',
      },
    })

    const div = wrapper.find('div')

    expect(div.exists()).toBe(true)
    expect(div.classes()).toContain('test-class')
    expect(wrapper.text()).toContain('Wrapped')
  })
})
