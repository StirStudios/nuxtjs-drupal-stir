import { CalendarDateTime, toZoned } from '@internationalized/date'

type DateParts = {
  year: number
  month: number
  day: number
}

/**
 * Formats a Webform datetime using the Drupal-provided IANA timezone.
 */
export function formatWebformDateTime(
  date: DateParts,
  time: string,
  timeZone: string,
): string {
  const [hour, minute] = time.split(':').map(Number)

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return ''

  const localDateTime = new CalendarDateTime(
    date.year,
    date.month,
    date.day,
    hour,
    minute,
    0,
  )
  const zonedDateTime = toZoned(localDateTime, timeZone)
  const offsetMinutes = zonedDateTime.offset / 60_000
  const sign = offsetMinutes < 0 ? '-' : '+'
  const absoluteOffset = Math.abs(offsetMinutes)
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0')
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, '0')

  return `${localDateTime.toString()}${sign}${offsetHours}${offsetRemainder}`
}

export function generateTimeOptions(min: string, max: string, step: number) {
  const times: { value: string; label: string }[] = []

  const [minH, minM] = min.split(':').map(Number)
  const [maxH, maxM] = max.split(':').map(Number)

  const current = new Date()

  current.setHours(minH ?? 0, minM ?? 0, 0, 0)

  const end = new Date()

  end.setHours(maxH ?? 0, maxM ?? 0, 0, 0)

  while (current <= end) {
    const h = String(current.getHours()).padStart(2, '0')
    const m = String(current.getMinutes()).padStart(2, '0')

    const hour12 = current.getHours() % 12 || 12
    const suffix = current.getHours() >= 12 ? 'PM' : 'AM'

    times.push({
      value: `${h}:${m}`,
      label: `${hour12}:${m} ${suffix}`,
    })

    current.setSeconds(current.getSeconds() + step)
  }

  return times
}
