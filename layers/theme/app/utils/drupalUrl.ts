import { resolveDrupalCeConfig } from '../../../foundation/shared/utils/drupalCeConfig'

type RuntimePublicConfigLike = {
  drupalCe?: unknown
}

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//.test(value)

export const getDrupalOrigin = (publicConfig: RuntimePublicConfigLike): string => {
  return resolveDrupalCeConfig(publicConfig).drupalBaseUrl
}

export const toDrupalUrl = (value: string | undefined, drupalOrigin: string): string => {
  const raw = String(value || '').trim()

  if (!raw) return ''
  if (isAbsoluteUrl(raw)) return raw

  const relativePath = raw.startsWith('/') ? raw : `/${raw}`

  return drupalOrigin ? `${drupalOrigin}${relativePath}` : relativePath
}
