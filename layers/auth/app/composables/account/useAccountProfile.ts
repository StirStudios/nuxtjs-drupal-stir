type ProfileField = {
  name: string
  label: string
  type: string
  required: boolean
  cardinality: number
  editable: boolean
  options?: Record<string, string>
}

type ProfileSchemaResponse = {
  fields?: ProfileField[]
}

type ProfileValuesResponse = {
  values?: Record<string, unknown>
  media?: {
    avatar?: Record<string, unknown> | null
    cover?: Record<string, unknown> | null
    gallery?: Array<Record<string, unknown>>
  }
}

type ProfileUpdateResponse = {
  updated?: boolean
  updated_fields?: string[]
  no_changes?: boolean
}

const MULTI_VALUE_TYPES = new Set(['list_string', 'list_integer'])

function normalizeValueForForm(field: ProfileField, value: unknown): unknown {
  if (value === null || value === undefined) {
    return field.cardinality > 1 || MULTI_VALUE_TYPES.has(field.type) ? [] : ''
  }

  if (field.cardinality > 1 || MULTI_VALUE_TYPES.has(field.type)) {
    if (Array.isArray(value)) {
      return value
    }

    return [value]
  }

  if (field.type === 'boolean') {
    return Boolean(value)
  }

  if (typeof value === 'object') {
    return ''
  }

  return value
}

function normalizeValueForSubmit(field: ProfileField, value: unknown): unknown {
  if (field.cardinality > 1 || MULTI_VALUE_TYPES.has(field.type)) {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => entry !== '' && entry !== null && entry !== undefined)
  }

  if (field.type === 'boolean') {
    return Boolean(value)
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  return value
}

export function useAccountProfile() {
  const fields = ref<ProfileField[]>([])
  const values = ref<Record<string, unknown>>({})
  const baselineValues = ref<Record<string, unknown>>({})
  const profileMedia = ref<{
    avatar: Record<string, unknown> | null
    cover: Record<string, unknown> | null
    gallery: Array<Record<string, unknown>>
  }>({
    avatar: null,
    cover: null,
    gallery: [],
  })
  const loading = ref(false)
  const saving = ref(false)

  const editableFields = computed(() => fields.value.filter((field) => field.editable))
  const hasChanges = computed(() => {
    for (const field of editableFields.value) {
      const current = normalizeValueForSubmit(field, values.value[field.name])
      const baseline = normalizeValueForSubmit(field, baselineValues.value[field.name])

      if (JSON.stringify(current) !== JSON.stringify(baseline)) {
        return true
      }
    }

    return false
  })

  const load = async () => {
    loading.value = true
    try {
      const [schema, profileValues] = await Promise.all([
        $fetch<ProfileSchemaResponse>('/api/account/profile/schema'),
        $fetch<ProfileValuesResponse>('/api/account/profile/values'),
      ])

      fields.value = Array.isArray(schema?.fields) ? schema.fields : []
      const sourceValues =
        profileValues && typeof profileValues.values === 'object'
          ? profileValues.values
          : {}

      const nextValues: Record<string, unknown> = {}

      for (const field of fields.value) {
        const currentValue = Object.prototype.hasOwnProperty.call(sourceValues, field.name)
          ? sourceValues[field.name]
          : undefined

        nextValues[field.name] = normalizeValueForForm(field, currentValue)
      }

      values.value = nextValues
      baselineValues.value = { ...nextValues }
      profileMedia.value = {
        avatar: (profileValues?.media?.avatar && typeof profileValues.media.avatar === 'object')
          ? profileValues.media.avatar
          : null,
        cover: (profileValues?.media?.cover && typeof profileValues.media.cover === 'object')
          ? profileValues.media.cover
          : null,
        gallery: Array.isArray(profileValues?.media?.gallery) ? profileValues.media.gallery : [],
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
      const payloadValues: Record<string, unknown> = {}

      for (const field of editableFields.value) {
        payloadValues[field.name] = normalizeValueForSubmit(
          field,
          values.value[field.name],
        )
      }

      const response = await $fetch<ProfileUpdateResponse>('/api/account/profile/values', {
        method: 'PATCH',
        body: {
          values: payloadValues,
        },
      })

      baselineValues.value = { ...values.value }

      return response
    } finally {
      saving.value = false
    }
  }

  return {
    fields,
    values,
    editableFields,
    profileMedia,
    hasChanges,
    loading,
    saving,
    load,
    save,
  }
}
