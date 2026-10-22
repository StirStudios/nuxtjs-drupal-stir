export function normalizeEnvironmentUrl(value: string | undefined): string {
  return (value || '').replace(/\/+$/, '')
}

export function positiveIntegerEnvironment(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function commaSeparatedEnvironment(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}
