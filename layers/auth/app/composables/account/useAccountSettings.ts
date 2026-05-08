type SettingsValuesResponse = {
  values?: Record<string, unknown>
}

type SettingsUpdateResponse = {
  updated?: boolean
  updated_fields?: string[]
  no_changes?: boolean
}

const SETTINGS_FIELDS = ['account_name', 'account_email'] as const

export function useAccountSettings() {
  const values = ref<Record<string, unknown>>({
    account_name: '',
    account_email: '',
  })
  const baselineValues = ref<Record<string, unknown>>({
    account_name: '',
    account_email: '',
  })
  const loading = ref(false)
  const saving = ref(false)

  const hasChanges = computed(() => {
    return SETTINGS_FIELDS.some((field) => {
      const current = String(values.value[field] ?? '').trim()
      const baseline = String(baselineValues.value[field] ?? '').trim()
      return current !== baseline
    })
  })

  const load = async () => {
    loading.value = true
    try {
      const response = await $fetch<SettingsValuesResponse>('/api/account/settings/values')
      const sourceValues =
        response && typeof response.values === 'object' && response.values !== null
          ? response.values
          : {}

      values.value = {
        account_name: String(sourceValues.account_name ?? ''),
        account_email: String(sourceValues.account_email ?? ''),
      }
      baselineValues.value = { ...values.value }
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
      const response = await $fetch<SettingsUpdateResponse>(
        '/api/account/settings/values',
        {
          method: 'PATCH',
          body: {
            values: {
              account_name: String(values.value.account_name ?? '').trim(),
              account_email: String(values.value.account_email ?? '').trim(),
            },
          },
        },
      )

      baselineValues.value = { ...values.value }
      return response
    } finally {
      saving.value = false
    }
  }

  return {
    values,
    hasChanges,
    loading,
    saving,
    load,
    save,
  }
}
