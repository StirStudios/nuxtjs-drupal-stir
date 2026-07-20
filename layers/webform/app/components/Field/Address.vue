<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { resolveUiFieldVariant } from '#stir/utils/nuxtUiProps'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, Record<string, string>>
  floatingLabel?: boolean
}>()

const webform = useStirWebformTheme()
const portal = useOverlayPortal()
const isMaterial = computed(() => webform.fieldVariant === 'material')
const inputUi = computed(() => useFloatingLabels.value
  ? { base: ['peer', isMaterial.value ? 'pt-4!' : ''] }
  : {})
const fieldVariant = computed(() => resolveUiFieldVariant(webform.fieldVariant))

const compositeFields = computed<Record<string, WebformFieldProps>>(() =>
  typeof props.field['#composite'] === 'object' &&
  props.field['#composite'] !== null
    ? props.field['#composite']
    : {},
)

const getCompositeLabel = (fieldData: WebformFieldProps, key: string) =>
  String(fieldData.label ?? key)

const countryOptions = computed(() => {
  const countryField = compositeFields.value.country
  const options =
    (typeof props.field.options === 'object'
      ? props.field.options
      : undefined) ??
    (countryField && typeof countryField.options === 'object'
      ? countryField.options
      : undefined) ??
    (countryField && typeof countryField['#options'] === 'object'
      ? countryField['#options']
      : undefined)

  return options
    ? Object.entries(options).map(([key, label]) => ({
        value: key,
        label: String(label),
      }))
    : []
})

const useFloatingLabels = computed(() =>
  props.field['#floating_label'] !== undefined
    ? props.field['#floating_label']
    : webform.labels.floating,
)

if (!props.state[props.fieldName]) {
  props.state[props.fieldName] = {}
}

const getFieldId = (key: string) => `${props.fieldName}-${key}`
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <UFormField
      v-for="(fieldData, key) in compositeFields"
      :key="key"
      :label="
        !useFloatingLabels ? getCompositeLabel(fieldData, String(key)) : ''
      "
      :name="`${fieldName}.${key}`"
      :required="!!field['#required']"
    >
      <UInput
        v-if="key !== 'country'"
        :id="getFieldId(String(key))"
        v-model="state[fieldName]![String(key)]"
        class="w-full"
        :placeholder="useFloatingLabels ? ' ' : ''"
        :ui="inputUi"
        :variant="fieldVariant"
      >
        <label
          v-if="useFloatingLabels"
          :class="webform.labels.floatingClass"
          :for="getFieldId(String(key))"
        >
          <span class="inline-flex rounded-sm bg-default pe-1">
            {{ getCompositeLabel(fieldData, String(key)) }}
          </span>
        </label>
      </UInput>

      <USelectMenu
        v-else
        :id="getFieldId(String(key))"
        v-model="state[fieldName]!.country"
        class="w-full"
        :items="countryOptions"
        label-key="label"
        placeholder="Select Country"
        :portal="portal"
        value-key="value"
        :variant="fieldVariant"
      />
    </UFormField>
  </div>
</template>
