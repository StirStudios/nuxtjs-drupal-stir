<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '../../../types'
import { CalendarDate as DateValue } from '@internationalized/date'
import DateTimeCalendar from './DateTime/Calendar.vue'
import DateTimeSelect from './DateTime/Select.vue'
import { generateTimeOptions, getOffsetString } from '~/utils/dateUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

const { emitFormInput, emitFormChange } = useFormField()
const { webform } = useAppConfig().stirTheme
const multiple = Number(props.field['#multiple']) || 1
const minTime = String(props.field['#dateTimeMin'] ?? '10:00:00')
const maxTime = String(props.field['#dateTimeMax'] ?? '22:00:00')
const step = Number(props.field['#dateTimeStep']) || 1800
const siteTimezone =
  typeof props.field['#timezone'] === 'string'
    ? props.field['#timezone']
    : 'America/Los_Angeles'
const timeOptions = generateTimeOptions(minTime, maxTime, step)

type DateTimeDate = {
  year: number
  month: number
  day: number
}

type DateTimeBlock = {
  date: DateTimeDate | null
  start: string
}

function formatCalendarDate(date: DateTimeDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(
    date.day,
  ).padStart(2, '0')}`
}

const blocks = ref<DateTimeBlock[]>(
  Array.from({ length: multiple }, (_, i) => {
    const stored = props.state[`${props.fieldName}-${i}`] ?? ''
    let date: DateTimeDate | null = null
    let start = timeOptions[0]?.value ?? '00:00'

    if (typeof stored === 'string' && stored.includes('T')) {
      const [dateStr, timeStr] = stored.split('T')

      if (!dateStr) return { date, start }
      const [y = Number.NaN, m = Number.NaN, d = Number.NaN] = dateStr
        .split('-')
        .map(Number)

      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        date = new DateValue(y, m, d)
      }

      const [sH, sM] = (timeStr || '').split(':')

      if (sH && sM) start = `${sH}:${sM}`
    }

    return { date, start }
  }),
)

const dateFieldLabel = (index: number) =>
  multiple > 1
    ? `${props.field['#title']} ${index + 1}`
    : String(props.field['#title'] ?? 'Date')
const timeFieldLabel = (index: number) =>
  multiple > 1 ? `Time ${index + 1}` : 'Time'
const fieldRequired = computed(() => !!props.field['#required'])

watchEffect(() => {
  if (!Array.isArray(props.state[props.fieldName])) {
    props.state[props.fieldName] = []
  }

  const values: string[] = []

  blocks.value.forEach((block) => {
    if (block.date && block.start) {
      const dateStr = formatCalendarDate(block.date)
      const [h = '', m = ''] = block.start.split(':')
      const s = '00'

      if (!h || !m) return

      const jsDate = new Date(`${dateStr}T${h}:${m}:${s}`)
      const offset = getOffsetString(siteTimezone, jsDate)
      const full = `${dateStr}T${h}:${m}:${s}${offset}`

      values.push(full)
    }
  })

  props.state[props.fieldName] = values
})

watch(
  blocks,
  () => {
    emitFormInput()
    emitFormChange()
  },
  { deep: true },
)
</script>

<template>
  <div class="space-y-3">
    <div class="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
      <template v-for="(block, i) in blocks" :key="i">
        <UFormField :label="dateFieldLabel(i)" :required="fieldRequired">
          <DateTimeCalendar
            v-model="block.date"
            :label="dateFieldLabel(i)"
            :timezone="siteTimezone"
            :variant="webform.variant"
          />
        </UFormField>

        <UFormField :label="timeFieldLabel(i)" :required="fieldRequired">
          <DateTimeSelect
            v-model="block.start"
            :items="timeOptions"
            placeholder="Select time"
            :variant="webform.variant"
          />
        </UFormField>
      </template>
    </div>
  </div>
</template>
