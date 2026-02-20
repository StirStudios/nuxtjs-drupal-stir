export function getOffsetString(
  timeZone: string,
  date: Date = new Date(),
): string {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  })

  const parts = dtf.formatToParts(date)
  const offset = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+0'

  const match = offset.match(/GMT([+-]?\d+)(?::(\d+))?/)

  if (match && match[1] !== undefined) {
    const rawHours = match[1]
    const sign = rawHours.startsWith('-') ? '-' : '+'
    const hours = String(Math.abs(Number(rawHours))).padStart(2, '0')
    const minutes = String(match[2] || '0').padStart(2, '0')

    return `${sign}${hours}${minutes}`
  }

  return '+0000'
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
