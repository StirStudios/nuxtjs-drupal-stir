export const DEFAULT_TIME_ZONE = 'America/Los_Angeles'

export function dayKey(date: Date, timeZone: string = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
