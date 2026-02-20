<script setup lang="ts">
import type { WebformFieldProps, WebformOptionProperties, WebformState } from '../../../types'
import { useEventBus } from '@vueuse/core'
import { cleanHTML } from '~/utils/cleanHTML'
import { enforceGroupLimit, enforceMaxSelected } from '~/utils/selectionUtils'
import { normalizeValue } from '~/utils/stringUtils'
import { handleTabChange } from '~/utils/visibilityUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

const descriptionContent = shallowRef<string>('')
const tabBus = useEventBus<string>('tab-changed')
let stopTabBus: (() => void) | null = null

onMounted(() => {
  if (!Array.isArray(props.state[props.fieldName])) {
    props.state[props.fieldName] = []
  }
  descriptionContent.value = cleanHTML(props.field['#description'] || '')

  stopTabBus = tabBus.on((tabValue: string) => {
    handleTabChange(
      props.field['#states']?.visible,
      tabValue,
      props.state,
      props.fieldName,
    )
  })

  handleModelUpdate(props.state[props.fieldName])
})

onBeforeUnmount(() => {
  stopTabBus?.()
  stopTabBus = null
})

const isFieldDisabled = computed(() => props.field['#disabled'] === true)
const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []

const getComparisonValue = (key?: string): number | null => {
  if (!key) return null
  const normalizedKey = Object.keys(props.state).find(
    (k) => normalizeValue(k) === normalizeValue(key),
  )
  const val = normalizedKey ? props.state[normalizedKey] : null

  return typeof val === 'number' || typeof val === 'string' ? Number(val) : null
}

const items = computed(() => {
  return Object.entries(props.field['#options'] || {}).map(([key, label]) => {
    const rawProps = (props.field['#optionProperties']?.[key] ||
      {}) as WebformOptionProperties
    const [min, max] = Array.isArray(rawProps.range) ? rawProps.range : []
    const compareKey = rawProps.checkAgainst
    const valueToCompare = getComparisonValue(compareKey)
    const disableWhen = rawProps.disableWhen
    const conditionValue = disableWhen?.field
      ? props.state[disableWhen.field]
      : null

    const selected = Array.isArray(conditionValue)
      ? toStringArray(conditionValue)
      : typeof conditionValue === 'object' && conditionValue !== null
        ? Object.keys(conditionValue as Record<string, unknown>).filter(
            (k) => (conditionValue as Record<string, unknown>)[k] === true,
          )
        : []

    const disabledByRule =
      !!disableWhen?.field &&
      !!disableWhen?.includes &&
      selected.includes(disableWhen.includes)

    const disabledByRange =
      valueToCompare !== null &&
      ((typeof min === 'number' && valueToCompare < min) ||
        (typeof max === 'number' && valueToCompare > max))

    const disabled = isFieldDisabled.value || disabledByRule || disabledByRange

    return {
      label,
      value: key,
      props: { ...rawProps, disabled },
      disabled,
    }
  })
})

const handleModelUpdate = (val: unknown) => {
  const selectedValues = toStringArray(val)
  const disabledKeys = new Set(
    items.value.filter((item) => item.disabled).map((item) => item.value),
  )

  const previous = toStringArray(props.state[props.fieldName])
  let updated = Array.from(
    new Set([
      ...selectedValues,
      ...previous.filter((key: string) => disabledKeys.has(key)),
    ]),
  )

  for (const selectedKey of updated) {
    const meta = props.field['#optionProperties']?.[
      selectedKey
    ] as WebformOptionProperties | undefined
    const linked = [...(meta?.linked_to ?? []), ...(meta?.linkedTo ?? [])]

    for (const linkedKey of linked) {
      if (!updated.includes(linkedKey) && !disabledKeys.has(linkedKey)) {
        updated.push(linkedKey)
      }
    }
  }

  updated = enforceGroupLimit(
    updated,
    props.fieldName,
    props.field['#group'],
    props.field['#groupMaxSelected'],
    props.state,
    webformState,
  )
  updated = enforceMaxSelected(updated, props.field['#maxSelected'])

  props.state[props.fieldName] = updated
}
</script>

<template>
  <UCheckboxGroup
    class="form-input w-full"
    :items="items"
    :model-value="props.state[props.fieldName]"
    @update:model-value="handleModelUpdate"
  >
    <template #label="{ item }">
      <span
        class="label"
        :class="{ 'text-muted': item.props.disabled }"
        v-html="item.label"
      />
      <span
        v-if="item.props.description"
        :class="{ 'text-muted': item.props.disabled }"
        v-html="item.props.description"
      />
    </template>
  </UCheckboxGroup>
</template>
