<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '../../../types'
import { CalendarDate, DateFormatter } from '@internationalized/date'
import { getOffsetString, generateTimeOptions } from '~/utils/dateUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

const { emitFormInput, emitFormChange } = useFormField()
const { webform } = useAppConfig().stirTheme
const isMaterial = computed(() => webform.variant === 'material')
const df = new DateFormatter('en-US', { dateStyle: 'medium' })
const multiple = Number(props.field['#multiple']) || 1
const minTime = String(props.field['#dateTimeMin'] ?? '10:00:00')
const maxTime = String(props.field['#dateTimeMax'] ?? '22:00:00')
const step = Number(props.field['#dateTimeStep']) || 1800
const siteTimezone =
  typeof props.field['#timezone'] === 'string'
    ? props.field['#timezone']
    : 'America/Los_Angeles'
const timeOptions = generateTimeOptions(minTime, maxTime, step)

type CalendarDateLike = {
  year: number
  month: number
  day: number
  toDate: (tz: string) => Date
}

type DateTimeBlock = {
  date: CalendarDateLike | null
  start: string
}

function formatCalendarDate(date: CalendarDateLike): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(
    date.day,
  ).padStart(2, '0')}`
}

function formatDateLabel(date: CalendarDateLike): string {
  const dateValue = date.toDate(siteTimezone)

  return df.format(dateValue)
}

const blocks = ref<DateTimeBlock[]>(
  Array.from({ length: multiple }, (_, i) => {
    const stored = props.state[`${props.fieldName}-${i}`] ?? ''
    let date: CalendarDateLike | null = null
    let start = timeOptions[0]?.value ?? '00:00'

    if (typeof stored === 'string' && stored.includes('T')) {
      const [dateStr, timeStr] = stored.split('T')

      if (!dateStr) return { date, start }
      const [y = Number.NaN, m = Number.NaN, d = Number.NaN] = dateStr
        .split('-')
        .map(Number)

      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        date = new CalendarDate(y, m, d)
      }

      const [sH, sM] = (timeStr || '').split(':')

      if (sH && sM) start = `${sH}:${sM}`
    }

    return { date, start }
  }),
)

const dateTriggerId = (index: number) => `${props.fieldName}-date-${index + 1}`
const dateTriggerLabelId = (index: number) =>
  `${props.fieldName}-date-label-${index + 1}`
const timeSelectId = (index: number) => `${props.fieldName}-time-${index + 1}`
const timeSelectName = (index: number) =>
  `${props.fieldName}_time_${index + 1}`
const datePopoverOpen = ref<boolean[]>(
  Array.from({ length: multiple }, () => false),
)

const closeDatePopover = (index: number) => {
  datePopoverOpen.value[index] = false
}
const dateFieldLabel = (index: number) =>
  multiple > 1 ? `${props.field['#title']} ${index + 1}` : String(props.field['#title'] ?? 'Date')
const timeFieldLabel = (index: number) =>
  multiple > 1 ? `Time ${index + 1}` : 'Time'
const dateButtonVariant = computed(() => isMaterial.value ? webform.variant : 'outline')
const dateButtonColor = computed(() => isMaterial.value ? webform.color ?? 'primary' : 'neutral')
const dateButtonClass = computed(() =>
  isMaterial.value
    ? 'w-full justify-start text-left'
    : 'w-full justify-start text-left font-normal',
)

watchEffect(() => {
  if (!Array.isArray(props.state[props.fieldName])) {
    props.state[props.fieldName] = []
  }

  const values: string[] = []

  blocks.value.forEach((block) => {
    if (block.date && block.start) {
      const dateStr = formatCalendarDate(block.date)
      const [h = '', m = ''] = block.start.split(':')

      if (!h || !m) return

      const jsDate = new Date(`${dateStr}T${h}:${m}:00`)
      const offset = getOffsetString(siteTimezone, jsDate)
      const full = `${dateStr}T${h}:${m}:00${offset}`

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
        <UFormField :label="dateFieldLabel(i)" :required="!!field['#required']">
          <UPopover
            v-model:open="datePopoverOpen[i]"
            class="w-full"
          >
            <UButton
              :id="dateTriggerId(i)"
              :aria-label="`${dateFieldLabel(i)}: ${block.date ? 'Change date' : 'Select date'}`"
              :aria-labelledby="dateTriggerLabelId(i)"
              :class="dateButtonClass"
              :color="dateButtonColor"
              icon="i-lucide-calendar"
              size="xl"
              :ui="{ leadingIcon: 'size-4' }"
              :variant="dateButtonVariant"
            >
              {{ block.date ? formatDateLabel(block.date) : 'Select date' }}
            </UButton>
            <template #content>
              <UCalendar
                v-model="block.date"
                class="p-2"
                @update:model-value="() => closeDatePopover(i)"
              />
            </template>
          </UPopover>
        </UFormField>

        <UFormField :label="timeFieldLabel(i)" :required="!!field['#required']">
          <USelect
            :id="timeSelectId(i)"
            v-model="block.start"
            :aria-label="`Time ${i + 1}`"
            class="w-full"
            :items="timeOptions"
            label-key="label"
            :name="timeSelectName(i)"
            placeholder="Select time"
            value-key="value"
            :variant="webform.variant"
          />
        </UFormField>
      </template>
    </div>
  </div>
</template>
