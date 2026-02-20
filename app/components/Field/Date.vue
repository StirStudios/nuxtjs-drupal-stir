<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '../../../types'
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from '@internationalized/date'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

const { emitFormInput, emitFormChange } = useFormField()
const { webform } = useAppConfig().stirTheme
const isMaterial = computed(() => webform.variant === 'material')
const df = new DateFormatter('en-US', { dateStyle: 'medium' })
const max = Number(props.field['#multiple']) || 1

const models = ref<CalendarDate[]>([])
const popoverOpen = ref(false)
const stored = props.state[props.fieldName]

if (Array.isArray(stored)) {
  models.value = stored
    .filter((val): val is string => typeof val === 'string')
    .map((val) => {
      const datePart = val.split('T')[0]
      if (!datePart) return null
      const [y, m, d] = datePart.split('-').map(Number)
      return y && m && d ? new CalendarDate(y, m, d) : null
    })
    .filter(Boolean) as CalendarDate[]
} else if (typeof stored === 'string' && stored.includes('-')) {
  const datePart = stored.split('T')[0]
  if (datePart) {
    const [y, m, d] = datePart.split('-').map(Number)
    if (y && m && d) {
      models.value = [new CalendarDate(y, m, d)]
    }
  }
}

watchEffect(() => {
  if (models.value.length > max) {
    models.value = models.value.slice(0, max)
  }

  const values = models.value
    .map((model) => model?.toString?.() ?? '')
    .filter(Boolean)

  props.state[props.fieldName] = max > 1 ? values : (values[0] ?? '')
})

watch(
  models,
  () => {
    if (max <= 1 && models.value.length > 0) {
      popoverOpen.value = false
    }
    emitFormInput()
    emitFormChange()
  },
  { deep: true },
)

const selectedDatesLabel = computed(() =>
  models.value.length
    ? models.value
        .map((model) => df.format(model.toDate(getLocalTimeZone())))
        .join(', ')
    : 'Select Date(s)',
)
</script>

<template>
  <UPopover v-model:open="popoverOpen" :class="{ 'w-full': isMaterial }">
    <UButton icon="i-lucide-calendar" size="md" :variant="webform.variant">
      <span class="sr-only">{{ field['#title'] }}:</span>
      {{ selectedDatesLabel }}
    </UButton>
    <template #content>
      <UCalendar v-model="models" class="p-2" multiple />
    </template>
  </UPopover>
</template>
