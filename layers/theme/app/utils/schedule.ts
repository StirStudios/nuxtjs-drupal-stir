export type ScheduleOccurrenceLike = {
  item?: {
    props?: {
      uuid?: string
    }
  }
  start: Date
  isLive: boolean
  isUpcoming: boolean
}

export type ScheduleFormatOptions = {
  timeZone?: string
}

export function keepNearestOccurrencePerSchedule<T extends ScheduleOccurrenceLike>(
  schedules: T[],
): T[] {
  const sorted = [...schedules].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1
    if (!a.isLive && b.isLive) return 1
    return +a.start - +b.start
  })

  const relevant = sorted.filter(({ isLive, isUpcoming }) => isLive || isUpcoming)
  const nearestByUuid = new Map<string, T>()
  const singleSchedules: T[] = []

  for (const schedule of relevant) {
    const uuid = schedule.item?.props?.uuid

    if (!uuid) {
      singleSchedules.push(schedule)
      continue
    }

    if (!nearestByUuid.has(uuid)) {
      nearestByUuid.set(uuid, schedule)
    }
  }

  return [...nearestByUuid.values(), ...singleSchedules].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1
    if (!a.isLive && b.isLive) return 1
    return +a.start - +b.start
  })
}

function getDateFormatter(timeZone?: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  })
}

function getDateKeyFormatter(timeZone?: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  })
}

function getTimeFormatter(timeZone?: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  })
}

function getDateKey(date: Date, formatter: Intl.DateTimeFormat): string {
  return formatter
    .formatToParts(date)
    .filter(({ type }) => type === 'year' || type === 'month' || type === 'day')
    .map(({ type, value }) => `${type}:${value}`)
    .join('|')
}

export function formatScheduleRange(
  start?: Date,
  end?: Date,
  timeTbd = false,
  options: ScheduleFormatOptions = {},
): string | null {
  if (!start) return null
  const dateFormatter = getDateFormatter(options.timeZone)
  const dateKeyFormatter = getDateKeyFormatter(options.timeZone)
  const timeFormatter = getTimeFormatter(options.timeZone)

  if (!end || timeTbd) {
    return `${dateFormatter.format(start)}, Time TBD`
  }

  const dateLabel = dateFormatter.format(start)
  const startTime = timeFormatter.format(start)
  const sameLocalDay =
    getDateKey(start, dateKeyFormatter) === getDateKey(end, dateKeyFormatter)
  const endTime = timeFormatter.format(end)

  const startDayPeriod = timeFormatter
    .formatToParts(start)
    .find((part) => part.type === 'dayPeriod')?.value
  const endDayPeriod = timeFormatter
    .formatToParts(end)
    .find((part) => part.type === 'dayPeriod')?.value

  if (sameLocalDay) {
    if (startDayPeriod && startDayPeriod === endDayPeriod) {
      const startWithoutDayPeriod = startTime.replace(
        new RegExp(`\\s*${startDayPeriod}$`),
        '',
      )

      return `${dateLabel}, ${startWithoutDayPeriod} - ${endTime}`
    }

    return `${dateLabel}, ${startTime} - ${endTime}`
  }

  return `${dateLabel}, ${startTime} - ${dateFormatter.format(end)}, ${endTime}`
}
