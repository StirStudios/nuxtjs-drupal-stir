export type AccountSettingsField = {
  editable?: boolean
  requires_current_password?: boolean
}

export type AccountSettingsValuesResponse = {
  fields?: Record<string, AccountSettingsField>
  values?: Record<string, unknown>
}

export type AccountSettingsValuesPayload = {
  values?: Record<string, unknown>
}

export type AccountSettingsUpdateResponse = {
  updated?: boolean
  updated_fields?: string[]
  no_changes?: boolean
}
