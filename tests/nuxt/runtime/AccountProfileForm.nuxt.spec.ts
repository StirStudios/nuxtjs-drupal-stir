import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AccountProfileForm from '../../../layers/auth/app/components/Account/ProfileForm.vue'

const emailField = {
  name: 'account_email',
  label: 'Email',
  type: 'email',
  required: true,
  editable: true,
}

const createProps = (requiresCurrentPassword: boolean) => ({
  editableFieldsCount: 1,
  fields: [emailField],
  hasProfileSave: true,
  requiresCurrentPassword,
  saving: false,
  values: {
    account_email: 'after@example.test',
    current_password: '',
  },
})

describe('AccountProfileForm', () => {
  it('only renders an accessible current-password field when required', async () => {
    const wrapper = await mountSuspended(AccountProfileForm, {
      props: createProps(false),
    })

    expect(wrapper.find('input[type="password"]').exists()).toBe(false)

    await wrapper.setProps({ requiresCurrentPassword: true })
    const passwordInput = wrapper.get('input[type="password"]')
    const passwordLabel = wrapper.findAll('label').find(label =>
      label.text().includes('Current password'),
    )

    expect(passwordInput.attributes('autocomplete')).toBe('current-password')
    expect(passwordLabel?.attributes('for')).toBe(passwordInput.attributes('id'))
  })

  it('validates the required current password before submitting', async () => {
    const wrapper = await mountSuspended(AccountProfileForm, {
      props: createProps(true),
    })

    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain(
        'Enter your current password to change your email address.',
      )
    })
    expect(wrapper.emitted('submit')).toBeUndefined()

    await wrapper.get('input[type="password"]').setValue('current-password')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.emitted('submit')).toHaveLength(1))
  })
})
