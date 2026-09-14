// Registered as a Nuxt type template by the auth layer, so keep it import-free.
type StirAuthAccountNavItemConfig = {
  label: string
  to: string
  icon?: string
  /**
   * Key of a resolver registered with `registerAccountNavVisibility()`. The
   * item is shown only while that resolver reports `true`; an unregistered key
   * hides the item.
   */
  visibility?: string
}

type StirAuthAppConfig = {
  accountNav?: {
    /**
     * Replaces the default account navigation (Settings) when non-empty.
     */
    items?: StirAuthAccountNavItemConfig[]
  }
}

declare module 'nuxt/schema' {
  interface AppConfigInput {
    auth?: StirAuthAppConfig
  }

  interface AppConfig {
    auth?: StirAuthAppConfig
  }
}

export {}
