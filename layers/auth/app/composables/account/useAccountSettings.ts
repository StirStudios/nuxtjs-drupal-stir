import type {
  AccountSettingsUpdateResponse,
  AccountSettingsValuesResponse,
} from '../../../shared/types/accountSettings'

const SETTINGS_FIELDS = ['account_name', 'account_email'] as const

type SettingsField = typeof SETTINGS_FIELDS[number]

const normalizeComparableValue = (field: SettingsField, value: unknown): string => {
  const normalized = String(value ?? '').trim()

  return field === 'account_email' ? normalized.toLowerCase() : normalized
}

export function useAccountSettings() {
  const values = ref<Record<string, unknown>>({
    account_name: '',
    account_email: '',
    current_password: '',
  })
  const baselineValues = ref<Record<string, unknown>>({
    account_name: '',
    account_email: '',
  })
  const loading = ref(false)
  const saving = ref(false)
  const fieldEditability = ref<Record<string, boolean>>({
    account_name: false,
    account_email: true,
  })
  const accountEmailRequiresCurrentPassword = ref(false)

  const accountEmailChanged = computed(() => {
    const current = normalizeComparableValue('account_email', values.value.account_email)
    const baseline = normalizeComparableValue('account_email', baselineValues.value.account_email)

    return current !== baseline
  })

  const requiresCurrentPassword = computed(() => {
    return accountEmailRequiresCurrentPassword.value && accountEmailChanged.value
  })

  const hasChanges = computed(() => {
    return SETTINGS_FIELDS.some((field) => {
      if (fieldEditability.value[field] !== true) return false

      const current = normalizeComparableValue(field, values.value[field])
      const baseline = normalizeComparableValue(field, baselineValues.value[field])

      return current !== baseline
    })
  })

  const load = async () => {
    loading.value = true
    try {
      const response = await $fetch<AccountSettingsValuesResponse>('/api/account/settings/values')
      const sourceValues =
        response && typeof response.values === 'object' && response.values !== null
          ? response.values
          : {}

      values.value = {
        account_name: String(sourceValues.account_name ?? ''),
        account_email: String(sourceValues.account_email ?? ''),
        current_password: '',
      }

      const sourceFields =
        response && typeof response.fields === 'object' && response.fields !== null
          ? response.fields
          : {}

      fieldEditability.value = {
        account_name:
          typeof sourceFields.account_name?.editable === 'boolean'
            ? sourceFields.account_name.editable
            : false,
        account_email:
          typeof sourceFields.account_email?.editable === 'boolean'
            ? sourceFields.account_email.editable
            : true,
      }
      accountEmailRequiresCurrentPassword.value =
        sourceFields.account_email?.requires_current_password === true

      baselineValues.value = {
        account_name: values.value.account_name,
        account_email: values.value.account_email,
      }
    } finally {
      loading.value = false
    }
  }

  const save = async () => {
    if (!hasChanges.value) {
      return {
        updated: false,
        updated_fields: [],
        no_changes: true,
      }
    }

    saving.value = true
    try {
      const changedValues = SETTINGS_FIELDS.reduce<Record<string, string>>((acc, field) => {
        if (fieldEditability.value[field] !== true) return acc

        const current = String(values.value[field] ?? '').trim()
        const comparableCurrent = normalizeComparableValue(field, current)
        const baseline = normalizeComparableValue(field, baselineValues.value[field])

        if (comparableCurrent !== baseline) {
          acc[field] = current
        }

        return acc
      }, {})

      if (requiresCurrentPassword.value) {
        const currentPassword = String(values.value.current_password ?? '')

        if (!currentPassword) {
          throw new Error('Current password is required to change your email address.')
        }

        changedValues.current_password = currentPassword
      }

      const response = await $fetch<AccountSettingsUpdateResponse>(
        '/api/account/settings/values',
        {
          method: 'PATCH',
          body: {
            values: changedValues,
          },
        },
      )

      baselineValues.value = {
        account_name: values.value.account_name,
        account_email: values.value.account_email,
      }
      values.value.current_password = ''
      return response
    } finally {
      saving.value = false
    }
  }

  return {
    values,
    fieldEditability,
    hasChanges,
    requiresCurrentPassword,
    loading,
    saving,
    load,
    save,
  }
}
