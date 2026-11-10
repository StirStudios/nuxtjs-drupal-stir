<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '#stir/types'
import {
  type CalendarDate,
  type DateValue,
  DateFormatter,
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import { parseWebformDateLimit } from '#stir/utils/dateUtils'
import { enforceMaxSelected } from '#stir-webform/utils/selectionUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
  floatingLabel?: boolean
}>()

const { id, disabled, ariaAttrs, emitFormInput, emitFormChange } = useFormField()
const webform = useStirWebformTheme()
const max = props.field['#cardinality'] ?? 1
const minValue = parseWebformDateLimit(props.field['#dateMin'])
const maxValue = parseWebformDateLimit(props.field['#dateMax'])

const stored = props.state[props.fieldName]
const models = shallowRef<CalendarDate[]>(
  (Array.isArray(stored) ? stored : [stored])
    .map(value => parseWebformDateLimit(value))
    .filter((value): value is CalendarDate => value !== undefined),
)
const placeholder = shallowRef<DateValue>(models.value[0] ?? minValue ?? today(getLocalTimeZone()))

// Filled month by month. A month that can't be read stays open: Drupal checks
// every date again when the form is submitted.
const unavailable = ref(new Set<string>())
const loadedMonths = new Set<string>()
const loading = ref(false)
const failed = ref(false)
const df = new DateFormatter('en-US', { dateStyle: 'medium' })
const formatDate = (date: CalendarDate) => df.format(date.toDate(getLocalTimeZone()))

async function loadMonth(date: DateValue) {
  const month = date.toString().slice(0, 7)

  if (loadedMonths.has(month)) return
  loadedMonths.add(month)
  loading.value = true

  try {
    const response = await $fetch<{ unavailable: string[] }>('/api/webform/availability', {
      query: {
        webform: props.field['#availabilityWebform'],
        element: props.field['#name'],
        month,
      },
    })

    unavailable.value = new Set([...unavailable.value, ...response.unavailable])
    failed.value = false
  } catch {
    loadedMonths.delete(month)
    failed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => loadMonth(placeholder.value))
watch(placeholder, loadMonth)

const isDateUnavailable = (date: DateValue) => unavailable.value.has(date.toString())

const calendarModel = computed({
  get: () => models.value as never,
  set: (value: unknown) => {
    models.value = enforceMaxSelected((Array.isArray(value) ? value : []) as CalendarDate[], max)
  },
})

watchEffect(() => {
  props.state[props.fieldName] = max > 1
    ? models.value.map(String)
    : (models.value[0]?.toString() ?? '')
})

function removeDate(date: CalendarDate) {
  models.value = models.value.filter(model => model.compare(date) !== 0)
}

const calendarUi = {
  grid: 'space-y-0',
  gridRow: 'place-items-stretch',
  headCell: 'pb-1 font-medium text-muted',
  cell: 'p-0.5',
  cellTrigger: [
    'm-0 h-11 w-full rounded-md bg-default font-semibold text-highlighted ring-1 ring-inset ring-primary/30 hover:bg-primary/10 hover:ring-primary sm:h-12',
    'data-outside-view:invisible',
    'data-disabled:bg-transparent data-disabled:font-normal! data-disabled:text-dimmed! data-disabled:no-underline! data-disabled:ring-0 data-disabled:hover:bg-transparent',
    'data-unavailable:not-data-disabled:bg-error/15 data-unavailable:not-data-disabled:font-normal data-unavailable:not-data-disabled:text-error-700 data-unavailable:not-data-disabled:ring-0',
    'data-selected:bg-primary data-selected:text-inverted data-selected:ring-0 data-selected:hover:bg-primary',
  ],
}

watch(models, () => {
  emitFormInput()
  emitFormChange()
})
</script>

<template>
  <div class="space-y-3">
    <label
      v-if="floatingLabel"
      :class="['block text-sm font-medium', field['#required'] === true && webform.labels.requiredClass]"
      :for="id"
    >
      {{ field['#title'] }}
    </label>
    <UCalendar
      :id="id"
      v-model="calendarModel"
      v-model:placeholder="placeholder"
      :aria-busy="loading"
      :class="['transition-opacity', loading && 'opacity-60']"
      :disabled="disabled"
      :fixed-weeks="false"
      :is-date-unavailable="isDateUnavailable"
      :max-value="maxValue"
      :min-value="minValue"
      multiple
      size="lg"
      :ui="calendarUi"
      :year-controls="false"
      v-bind="ariaAttrs"
    />

    <ul class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
      <li class="flex items-center gap-2">
        <span aria-hidden="true" class="size-4 rounded bg-default ring-1 ring-inset ring-primary/30" />
        Available
      </li>
      <li class="flex items-center gap-2">
        <span aria-hidden="true" class="size-4 rounded bg-error/15" />
        Unavailable
      </li>
      <li class="flex items-center gap-2">
        <span aria-hidden="true" class="size-4 rounded bg-primary" />
        Selected
      </li>
    </ul>

    <p v-if="failed" class="text-sm text-muted" role="status">
      We couldn't load availability just now. We'll confirm your dates when you submit.
    </p>

    <div class="space-y-2 border-t border-default pt-3">
      <p aria-live="polite" class="text-sm font-medium">
        Selected dates: {{ models.length }} of {{ max }}
      </p>
      <div v-if="models.length" class="flex flex-wrap gap-2">
        <UButton
          v-for="date in models"
          :key="date.toString()"
          :aria-label="`Remove ${formatDate(date)}`"
          color="neutral"
          :disabled="disabled"
          :label="formatDate(date)"
          size="sm"
          trailing-icon="i-lucide-x"
          variant="outline"
          @click="removeDate(date)"
        />
      </div>
      <p v-else class="text-sm text-muted">
        Choose dates on the calendar above.
      </p>
    </div>
  </div>
</template>
