const telInvalidCharacterRegex = /[^0-9\s\-().+]/
const telInvalidCharactersGlobalRegex = /[^0-9\s\-().+]/g
const plusCharacterRegex = /\+/g

export const telPattern = '\\+?[0-9\\s\\-().]{7,20}'

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
