import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FieldSelect from '../../../layers/webform/app/components/Field/Select.vue'

describe('FieldSelect filter buttons', () => {
  it('exposes selection and prevents changes when disabled', async () => {
    const state = { tabs: 'one' }
    const wrapper = await mountSuspended(FieldSelect, {
      props: { fieldName: 'tabs', state, items: { one: 'One', two: 'Two' } },
    })
    const buttons = wrapper.findAll('button')

    expect(buttons[0]!.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]!.attributes('aria-pressed')).toBe('false')
    await buttons[1]!.trigger('click')
    expect(state.tabs).toBe('two')
    await wrapper.setProps({ disabled: true })
    expect(buttons[0]!.attributes('disabled')).toBeDefined()
    await buttons[0]!.trigger('click')
    expect(state.tabs).toBe('two')
    wrapper.unmount()
  })
})
