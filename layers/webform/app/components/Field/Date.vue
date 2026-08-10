<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '#stir/types'
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from '@internationalized/date'
import { resolveUiButtonVariant } from '#stir/utils/nuxtUiProps'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
  floatingLabel?: boolean
}>()

const {
  id,
  size,
  color,
  disabled,
  ariaAttrs,
  emitFormInput,
  emitFormChange,
} = useFormField()
const webform = useStirWebformTheme()
const portal = useOverlayPortal()
const buttonVariant = computed(() => resolveUiButtonVariant(webform.fieldVariant, 'outline'))
const compactControlClass = computed(() =>
  props.floatingLabel ? webform.compactControlClass : [],
)
const df = new DateFormatter('en-US', { dateStyle: 'medium' })
const max = props.field['#cardinality'] ?? 1

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
const calendarModel = computed({
  get: () => models.value as never,
  set: (value: unknown) => {
    models.value = (Array.isArray(value) ? value : []) as CalendarDate[]
  },
})
</script>

<template>
  <div class="relative">
    <UPopover
      v-model:open="popoverOpen"
      class="w-full"
      :content="{ align: 'start' }"
      :portal="portal"
    >
      <UButton
        :id="id"
        :class="['w-full justify-start', compactControlClass]"
        :color="color ?? 'neutral'"
        :disabled="disabled"
        icon="i-lucide-calendar"
        :size="size ?? 'xl'"
        :ui="{
          base: [
            'text-base font-normal normal-case',
            color === 'error' ? 'ring-error' : '',
            models.length ? 'text-default!' : 'text-dimmed!',
          ],
          leadingIcon: ['size-5', 'text-dimmed'],
        }"
        :variant="buttonVariant"
        v-bind="ariaAttrs"
      >
        {{ selectedDatesLabel }}
      </UButton>
      <template #content>
        <UCalendar v-model="calendarModel" class="p-2" multiple />
      </template>
    </UPopover>
    <label
      v-if="floatingLabel"
      :class="webform.labels.staticFloatingClass"
      :for="id"
    >
      {{ field['#title'] }}
    </label>
  </div>
</template>
