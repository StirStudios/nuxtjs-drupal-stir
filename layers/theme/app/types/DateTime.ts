export type DateTimeDate = {
  year: number
  month: number
  day: number
}

export type DateTimeBlock = {
  date: DateTimeDate | null
  start: string
}
