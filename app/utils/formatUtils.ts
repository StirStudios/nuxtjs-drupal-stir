export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatUnixDate(
  unix: number | string,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  const numeric = Number(unix)

  if (!Number.isFinite(numeric)) return ''

  const date = new Date(numeric * 1000)

  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, options)
}

export function formatZonedDateTime(
  value: string | Date,
  timeZone = 'America/Los_Angeles',
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
): string {
  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    ...options,
  }).format(date)
}
