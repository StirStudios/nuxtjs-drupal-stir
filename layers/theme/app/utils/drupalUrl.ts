type DrupalCePublicConfig = {
  drupalBaseUrl?: string
}

type RuntimePublicConfigLike = {
  api?: string
  drupalCe?: DrupalCePublicConfig | Record<string, unknown>
}

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//.test(value)

export const getDrupalOrigin = (publicConfig: RuntimePublicConfigLike): string => {
  const drupalCe = (publicConfig.drupalCe || {}) as DrupalCePublicConfig
  const raw = String(drupalCe.drupalBaseUrl || publicConfig.api || '').trim()

  return raw.replace(/\/$/, '')
}

export const toDrupalUrl = (value: string | undefined, drupalOrigin: string): string => {
  const raw = String(value || '').trim()

  if (!raw) return ''
  if (isAbsoluteUrl(raw)) return raw

  const relativePath = raw.startsWith('/') ? raw : `/${raw}`

  return drupalOrigin ? `${drupalOrigin}${relativePath}` : relativePath
}
