<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'
import { cleanHTML } from '~/utils/cleanHTML'
import { useEvaluateState } from '~/composables/useEvaluateState'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, boolean | string>
}>()

const descriptionContent = shallowRef('')
const checkboxValue = ref<boolean>(false)
const optionProps = props.field['#optionProperties'] || {}
const checkboxId = computed(
  () => props.field['#id'] || `checkbox-${props.fieldName}`,
)
const checkboxLabel = computed(() =>
  String(props.field['#title'] || props.fieldName),
)
const { disabled, checked } = useEvaluateState(
  props.field['#states'] ?? {},
  props.state,
)

onMounted(() => {
  descriptionContent.value = cleanHTML(props.field['#description'] || '')

  const initial = Object.prototype.hasOwnProperty.call(
    props.state,
    props.fieldName,
  )
    ? !!props.state[props.fieldName]
    : !!props.field['#defaultValue']

  checkboxValue.value = initial
  props.state[props.fieldName] = initial
})

if (props.field['#states']?.checked) {
  watch(checked, (value) => {
    const safe = !!value

    checkboxValue.value = safe
    props.state[props.fieldName] = safe
  })
} else {
  watch(checkboxValue, (val) => {
    props.state[props.fieldName] = !!val
  })
}

const handleModelUpdate = (val: boolean) => {
  checkboxValue.value = !!val
  props.state[props.fieldName] = !!val
}
</script>

<template>
  <UCheckbox
    :id="checkboxId"
    v-model="checkboxValue"
    :aria-label="checkboxLabel"
    class="form-input w-full"
    :disabled="disabled"
    :label="checkboxLabel"
    name=""
    :ui="{
      label: descriptionContent ? 'sr-only' : '',
    }"
    @update:model-value="handleModelUpdate"
  >
    <template #label>
      <span :class="{ 'text-muted': optionProps.disabled }">
        {{ field['#title'] }}
      </span>
      <span
        v-if="optionProps.description"
        :class="{ 'text-muted': optionProps.disabled }"
      >
        {{ optionProps.description }}
      </span>
      <span
        v-if="optionProps.price"
        class="extra"
        :class="{ 'text-muted': optionProps.disabled }"
      >
        ${{ optionProps.price.toLocaleString() }}
      </span>
    </template>

    <template #description>
      <span v-html="descriptionContent" />
    </template>
  </UCheckbox>
</template>
