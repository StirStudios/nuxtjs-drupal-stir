<script setup lang="ts">
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from '@internationalized/date'
import {
  resolveUiButtonVariant,
  type UiFieldVariant,
} from '#stir/utils/nuxtUiProps'
import type { DateTimeDate } from '#stir/types'

const props = defineProps<{
  invalid?: boolean
  label: string
  modelValue: DateTimeDate | null
  timezone: string
  variant?: UiFieldVariant
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DateTimeDate | null]
}>()

const { id, size, color, disabled, ariaAttrs } = useFormField()
const portal = useOverlayPortal()
const df = computed(() =>
  new DateFormatter('en-US', {
    dateStyle: 'medium',
    timeZone: props.timezone,
  }),
)
const popoverOpen = ref(false)
const buttonVariant = computed(() => resolveUiButtonVariant(props.variant, 'outline'))

const model = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    if (value) popoverOpen.value = false
  },
})

const selectedDateLabel = computed(() =>
  model.value
    ? df.value.format(
        new CalendarDate(
          model.value.year,
          model.value.month,
          model.value.day,
        ).toDate(props.timezone || getLocalTimeZone()),
      )
    : 'Select date',
)
</script>

<template>
  <UPopover
    v-model:open="popoverOpen"
    class="w-full"
    :portal="portal"
  >
    <UButton
      v-bind="ariaAttrs"
      :id="id"
      :aria-invalid="invalid || undefined"
      class="w-full justify-start"
      :color="invalid ? 'error' : (color ?? 'neutral')"
      :disabled="disabled"
      icon="i-lucide-calendar"
      :size="size ?? 'xl'"
      :ui="{
        base: invalid ? 'font-normal ring-error' : 'font-normal',
        label: model ? 'text-default' : 'text-dimmed',
        leadingIcon: 'text-dimmed',
      }"
      :variant="buttonVariant"
    >
      <span class="sr-only">{{ label }}:</span>
      {{ selectedDateLabel }}
    </UButton>

    <template #content>
      <LazyUCalendar v-model="model" class="p-2" />
    </template>
  </UPopover>
</template>
