/**
 * The `current_user` and `local_tasks` Drupal puts on a CE page response.
 *
 * These mirror the stir-tools contract (`page-current-user.schema.json`);
 * `capabilities` is what decides editorial UI, and `admin_dashboard_url` is
 * present only when Drupal allows this account to open the dashboard. Both
 * objects stay open, because Lupus and site modules add their own keys.
 */
export type StirDrupalCapabilities = {
  editorialUi: boolean
} & Record<string, boolean>

export type StirDrupalCurrentUser = {
  id?: number | string
  uid?: number | string
  name?: string
  roles?: string[]
  capabilities?: StirDrupalCapabilities | null
  admin_dashboard_url?: string
  authenticated?: boolean
} & Record<string, unknown>

export type StirDrupalLocalTask = {
  label: string
  url: string
  active?: boolean
}

export type StirDrupalLocalTasks = {
  primary: StirDrupalLocalTask[]
  secondary: StirDrupalLocalTask[]
}
