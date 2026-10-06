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

// Augment `@nuxt/schema`: from Nuxt 4.6, `nuxt/schema` only re-exports it, and
// augmentations of a re-exported interface never reach `useAppConfig()`.
declare module '@nuxt/schema' {
  interface AppConfigInput {
    auth?: StirAuthAppConfig
  }

  interface AppConfig {
    auth?: StirAuthAppConfig
  }
}

export {}
