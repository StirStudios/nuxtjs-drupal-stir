const telInvalidCharacterRegex = /[^0-9\s\-().+]/
const telInvalidCharactersGlobalRegex = /[^0-9\s\-().+]/g
const plusCharacterRegex = /\+/g
const digitsGlobalRegex = /\D/g

export const telPattern = '\\+?[0-9\\s\\-\\(\\)\\.]{7,20}'

export function isTelCharacterAllowed(value: string): boolean {
  return !telInvalidCharacterRegex.test(value)
}

export function shouldPreventTelBeforeInput(data?: string | null): boolean {
  if (!data) return false

  return !isTelCharacterAllowed(data)
}

export function shouldPreventTelKeydown(
  key: string,
  options: { metaKey?: boolean, ctrlKey?: boolean, altKey?: boolean } = {},
): boolean {
  if (options.metaKey || options.ctrlKey || options.altKey) return false
  if (key.length !== 1) return false

  return !isTelCharacterAllowed(key)
}

export function sanitizeTelValue(value: unknown): string {
  const stripped = String(value ?? '').replace(telInvalidCharactersGlobalRegex, '')

  if (!stripped.includes('+')) return stripped

  const withoutPlus = stripped.replace(plusCharacterRegex, '')

  return stripped.startsWith('+') ? `+${withoutPlus}` : withoutPlus
}

function formatUsPhoneBody(digits: string): string {
  const area = digits.slice(0, 3)
  const prefix = digits.slice(3, 6)
  const line = digits.slice(6, 10)

  if (!area) return ''
  if (!prefix) return `(${area}`
  if (!line) return `(${area}) ${prefix}`

  return `(${area}) ${prefix}-${line}`
}

export function formatTelDisplayValue(value: unknown): string {
  const sanitized = sanitizeTelValue(value)
  const hasLeadingPlus = sanitized.startsWith('+')
  const digits = sanitized.replace(digitsGlobalRegex, '')

  if (!digits) return hasLeadingPlus ? '+' : ''

  if (hasLeadingPlus && digits.startsWith('1')) {
    const countryCode = '+1'
    const localDigits = digits.slice(1, 11)
    const formattedLocal = formatUsPhoneBody(localDigits)

    return formattedLocal ? `${countryCode} ${formattedLocal}` : countryCode
  }

  return formatUsPhoneBody(digits.slice(0, 10))
}

export function normalizeNumberBounds(
  min: unknown,
  max: unknown,
  minimumAllowedValue = 1,
): { min: number, max?: number } {
  const minValue = Number(min)
  const normalizedMin = Number.isFinite(minValue)
    ? Math.max(minimumAllowedValue, minValue)
    : minimumAllowedValue

  const maxValue = Number(max)
  const normalizedMax = Number.isFinite(maxValue)
    ? Math.max(normalizedMin, maxValue)
    : undefined

  return {
    min: normalizedMin,
    max: normalizedMax,
  }
}

export function clampNumberToBounds(
  value: number,
  bounds: { min: number, max?: number },
): number {
  return bounds.max === undefined
    ? Math.max(bounds.min, value)
    : Math.min(bounds.max, Math.max(bounds.min, value))
}
