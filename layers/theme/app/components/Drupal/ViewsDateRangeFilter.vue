<script setup lang="ts">
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  type DateValue,
} from '@internationalized/date'

interface DateRangeValue {
  start: DateValue | undefined
  end: DateValue | undefined
}

const props = withDefaults(defineProps<{
  disabled?: boolean
  label: string
  locale?: string
  modelValue?: string | string[]
}>(), {
  disabled: false,
  locale: 'en-US',
  modelValue: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const formatter = computed(() => new DateFormatter(props.locale, {
  dateStyle: 'medium',
}))
const timeZone = getLocalTimeZone()
const localValue = shallowRef<DateRangeValue>(modelToDateRange(props.modelValue))
const open = ref(false)

const calendarValue = computed<DateRangeValue>({
  get: () => localValue.value,
  set: (value) => {
    localValue.value = value
  },
})

const buttonLabel = computed(() => {
  const { start, end } = calendarValue.value

  if (!start) return props.label
  if (!end) return formatter.value.format(start.toDate(timeZone))

  return `${formatter.value.format(start.toDate(timeZone))} – ${formatter.value.format(end.toDate(timeZone))}`
})

watch(
  () => props.modelValue,
  (value) => {
    localValue.value = modelToDateRange(value)
  },
  { deep: true },
)

function modelToDateRange(value: string | string[] | undefined): DateRangeValue {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return {
    start: parseDateValue(values[0]),
    end: parseDateValue(values[1]),
  }
}

function parseDateValue(value: string | undefined): DateValue | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined

  return parseDate(value)
}

function applyDateRange(): void {
  emit('update:modelValue', [
    localValue.value.start?.toString() || '',
    localValue.value.end?.toString() || '',
  ].filter(Boolean))
  open.value = false
}

function clearDateRange(): void {
  localValue.value = { start: undefined, end: undefined }
  emit('update:modelValue', [])
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start' }">
    <UButton
      :aria-label="label"
      class="min-w-40 justify-between"
      color="neutral"
      :disabled="disabled"
      icon="i-lucide-calendar"
      :label="buttonLabel"
      trailing-icon="i-lucide-chevron-down"
      variant="outline"
    />

    <template #content>
      <div class="space-y-2 p-2">
        <UCalendar v-model="calendarValue" range />
        <div class="flex justify-end gap-2 border-t border-default pt-2">
          <UButton
            color="neutral"
            label="Clear"
            size="sm"
            variant="ghost"
            @click="clearDateRange"
          />
          <UButton
            :disabled="!calendarValue.start"
            label="Apply"
            size="sm"
            @click="applyDateRange"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
