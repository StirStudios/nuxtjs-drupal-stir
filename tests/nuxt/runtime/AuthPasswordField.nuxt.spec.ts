import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AccountSecurityForm from '../../../layers/auth/app/components/Account/SecurityForm.vue'
import AuthPasswordField from '../../../layers/auth/app/components/Auth/AuthPasswordField.vue'

const passwordPolicy = {
  requirements: [
    { key: 'minLength', pattern: '.{8,}', label: 'At least 8 characters' },
    { key: 'number', pattern: '\\d', label: 'At least 1 number' },
    { key: 'lowercase', pattern: '[a-z]', label: 'At least 1 lowercase letter' },
    { key: 'uppercase', pattern: '[A-Z]', label: 'At least 1 uppercase letter' },
  ],
}

describe('AuthPasswordField', () => {
  it('renders the Nuxt UI strength progress and Drupal requirements', async () => {
    const wrapper = await mountSuspended(AuthPasswordField, {
      props: {
        modelValue: 'password',
        passwordPolicy,
      },
    })

    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
    expect(wrapper.get('#password-strength').text()).toContain('Weak password')
    expect(wrapper.findAll('li')).toHaveLength(4)
    expect(wrapper.text()).toContain('At least 1 number')
  })

  it('hides strength guidance only when explicitly requested', async () => {
    const wrapper = await mountSuspended(AuthPasswordField, {
      props: {
        hideStrength: true,
        modelValue: '',
        passwordPolicy,
      },
    })

    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
    expect(wrapper.find('#password-strength').exists()).toBe(false)
  })

  it('uses the app config field theme and the shared visibility toggle', async () => {
    const webform = useAppConfig().stirTheme.webform
    const previousVariant = webform.fieldVariant

    webform.fieldVariant = 'material'

    try {
      const wrapper = await mountSuspended(AccountSecurityForm, {
        props: { currentPassword: '', newPassword: '', changingPassword: false, cancelingAccount: false, cancelModalOpen: false, portal: false },
      })
      const [currentInput, newInput] = wrapper.findAll('input')
      const newPasswordToggle = wrapper.get('button[aria-label="Show password"]')

      expect(newInput!.attributes('aria-describedby')).toBe('password-strength')
      expect(newInput!.classes()).toEqual(expect.arrayContaining(['border-b-2!', 'ring-0!', 'bg-transparent']))
      expect(newInput!.classes()).not.toContain('ring-inset')
      expect(newInput!.classes()).toEqual(currentInput!.classes())
      expect(newPasswordToggle.attributes('aria-pressed')).toBe('false')
      expect(newPasswordToggle.classes())
        .toEqual(wrapper.get('button[aria-label="Show current password"]').classes())
      wrapper.unmount()
    } finally {
      webform.fieldVariant = previousVariant
    }
  })
})
