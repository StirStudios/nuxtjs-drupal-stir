/** The layer's Drupal CE settings, as `runtimeConfig.public.drupalCe` holds them. */
export interface DrupalCeConfig {
  /** Drupal origin the browser and SEO tags use, without a trailing slash. */
  drupalBaseUrl: string
  /** Drupal origin for server requests, when it differs; empty otherwise. */
  serverDrupalBaseUrl: string
  /** CE API path prefix, with a leading slash and none trailing. */
  ceApiEndpoint: string
  /** Base URL for menu requests; empty means through the CE API. */
  menuBaseUrl: string
  /** Menu path under the base, with `$$$NAME$$$` for the menu name. */
  menuEndpoint: string
  useLocalizedMenuEndpoint: boolean
}

export const DEFAULT_CE_API_ENDPOINT = '/ce-api'
export const DEFAULT_MENU_ENDPOINT = 'api/menu_items/$$$NAME$$$'

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''
const withoutTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const normalizeEndpoint = (value: unknown): string => {
  const path = text(value).replace(/^\/+|\/+$/g, '')

  return path ? `/${path}` : DEFAULT_CE_API_ENDPOINT
}

/**
 * Reads the Drupal CE settings from public runtime config, filling defaults.
 * Layers without the platform config, and runtime overrides, may leave keys
 * out or blank.
 */
// Takes any object: a preset without the platform layer has a public config
// type with no `drupalCe` key, which a `{ drupalCe?: unknown }` parameter
// rejects as a weak type.
export function resolveDrupalCeConfig(publicConfig: object): DrupalCeConfig {
  const drupalCe = (publicConfig as { drupalCe?: unknown }).drupalCe
  const raw = drupalCe && typeof drupalCe === 'object'
    ? drupalCe as Record<string, unknown>
    : {}

  return {
    drupalBaseUrl: withoutTrailingSlash(text(raw.drupalBaseUrl)),
    serverDrupalBaseUrl: withoutTrailingSlash(text(raw.serverDrupalBaseUrl)),
    ceApiEndpoint: normalizeEndpoint(raw.ceApiEndpoint),
    menuBaseUrl: withoutTrailingSlash(text(raw.menuBaseUrl)),
    menuEndpoint: text(raw.menuEndpoint) || DEFAULT_MENU_ENDPOINT,
    useLocalizedMenuEndpoint: raw.useLocalizedMenuEndpoint !== false,
  }
}
