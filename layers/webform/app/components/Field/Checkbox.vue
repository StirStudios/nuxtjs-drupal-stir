<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'
import { useEvaluateState } from '#stir-webform/composables/useEvaluateState'
import { resolveWebformBoolean } from '#stir-webform/utils/webformFieldUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, boolean | string>
}>()

const optionProps = props.field['#optionProperties'] || {}
const checkboxId = computed(
  () => String(props.field['#id'] ?? `checkbox-${props.fieldName}`),
)
const checkboxLabel = computed(() =>
  String(props.field['#title'] || props.fieldName),
)
const descriptionContent = computed(() =>
  trustedDrupalHtml(String(props.field['#description'] ?? '')),
)
const { disabled, checked } = useEvaluateState(
  props.field['#states'] ?? {},
  props.state,
)

const checkboxValue = computed({
  get: () => resolveWebformBoolean(props.state[props.fieldName]),
  set: (value: boolean | 'indeterminate') => {
    props.state[props.fieldName] = value === true
  },
})

if (props.field['#states']?.checked) {
  watch(checked, (value) => {
    checkboxValue.value = value
  })
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
