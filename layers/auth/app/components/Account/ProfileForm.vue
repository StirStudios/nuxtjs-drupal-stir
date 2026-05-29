<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { validateProfileValues } from '../../utils/profileValidation'

type ProfileField = {
  name: string
  label: string
  type: string
  required: boolean
  editable: boolean
  options?: Record<string, string>
}

const props = defineProps<{
  fields: ProfileField[]
  values: Record<string, unknown>
  editableFieldsCount: number
  hasProfileSave: boolean
  saving: boolean
  heading?: string
  subheading?: string
}>()

const emit = defineEmits<{
  submit: []
}>()
const themeWebform = (
  (
    useAppConfig().stirTheme as {
      webform?: { variant?: 'outline' | 'material' | 'soft' | 'subtle' | 'ghost' | 'none'; fieldInput?: string }
    }
  ).webform || {}
)
const webformVariant = computed(() => themeWebform.variant as never)

const getFieldType = (
  type: string,
): 'text' | 'textarea' | 'select' | 'checkbox' => {
  if (type === 'text_long' || type === 'string_long') {
    return 'textarea'
  }

  if (type === 'boolean') {
    return 'checkbox'
  }

  if (type === 'list_string' || type === 'list_integer') {
    return 'select'
  }

  return 'text'
}

const toSelectItems = (field: {
  options?: Record<string, string>
}): Array<{ label: string; value: string }> => {
  const options = field.options || {}

  return Object.entries(options).map(([value, label]) => ({
    label,
    value,
  }))
}

const onSubmit = () => {
  emit('submit')
}

const getStringValue = (value: unknown): string => (typeof value === 'string' ? value : '')
const getCheckboxValue = (value: unknown): boolean => value === true

const validate = (state: Record<string, unknown>): FormError[] => {
  return validateProfileValues(props.fields, state)
}
</script>

<template>
  <div class="space-y-6 pt-4">
    <div class="space-y-1">
      <h2 class="text-highlighted text-base font-semibold">{{ props.heading || 'Settings' }}</h2>
      <p class="text-muted text-sm">{{ props.subheading || 'Update your account settings.' }}</p>
    </div>

    <UForm
      class="space-y-5"
      :state="props.values"
      :validate="validate"
      @submit="onSubmit"
    >
      <UFormField
        v-for="field in props.fields"
        :key="field.name"
        :label="field.label"
        :name="field.name"
        :required="field.required"
      >
        <UCheckbox
          v-if="getFieldType(field.type) === 'checkbox'"
          :disabled="!field.editable"
          :model-value="getCheckboxValue(props.values[field.name])"
          @update:model-value="props.values[field.name] = $event === true"
        />

        <UTextarea
          v-else-if="getFieldType(field.type) === 'textarea'"
          :class="themeWebform.fieldInput || 'w-full'"
          :disabled="!field.editable"
          :model-value="getStringValue(props.values[field.name])"
          :rows="4"
          :variant="webformVariant"
          @update:model-value="props.values[field.name] = String($event ?? '')"
        />

        <USelect
          v-else-if="getFieldType(field.type) === 'select'"
          :class="themeWebform.fieldInput || 'w-full'"
          :disabled="!field.editable"
          :items="toSelectItems(field)"
          label-key="label"
          :model-value="getStringValue(props.values[field.name])"
          value-key="value"
          :variant="webformVariant"
          @update:model-value="props.values[field.name] = String($event ?? '')"
        />

        <UInput
          v-else
          :class="themeWebform.fieldInput || 'w-full'"
          :disabled="!field.editable"
          :model-value="getStringValue(props.values[field.name])"
          type="text"
          :variant="webformVariant"
          @update:model-value="props.values[field.name] = String($event ?? '')"
        />
      </UFormField>

      <div v-if="props.editableFieldsCount === 0" class="text-muted text-sm">
        No editable profile fields are currently available.
      </div>

      <UButton
        class="mt-5"
        :disabled="props.saving || !props.hasProfileSave"
        :loading="props.saving"
        type="submit"
      >
        Save Changes
      </UButton>
    </UForm>
  </div>
</template>
