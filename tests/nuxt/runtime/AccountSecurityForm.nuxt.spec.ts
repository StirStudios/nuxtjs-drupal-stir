import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AccountSecurityForm from '../../../layers/auth/app/components/Account/SecurityForm.vue'

describe('AccountSecurityForm', () => {
  it('names the password visibility action in both states', async () => {
    const wrapper = await mountSuspended(AccountSecurityForm, {
      props: { currentPassword: 'example', newPassword: '', changingPassword: false, cancelingAccount: false, cancelModalOpen: false, portal: false },
    })

    await wrapper.get('button[aria-label="Show current password"]').trigger('click')
    expect(wrapper.find('button[aria-label="Hide current password"]').exists()).toBe(true)
    expect(wrapper.get('input').attributes('type')).toBe('text')
    await wrapper.get('button[aria-label="Hide current password"]').trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('password')
    wrapper.unmount()
  })
})
