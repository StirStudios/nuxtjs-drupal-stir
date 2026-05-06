<script setup lang="ts">
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
}>()

const emit = defineEmits<{
  submit: []
}>()

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
</script>

<template>
  <div class="space-y-6 pt-4">
    <div class="space-y-1">
      <h2 class="text-highlighted text-base font-semibold">Profile</h2>
      <p class="text-muted text-sm">Update your basic account information.</p>
    </div>

    <UForm class="space-y-5" :state="props.values" @submit="onSubmit">
      <UFormField
        v-for="field in props.fields"
        :key="field.name"
        :label="field.label"
        :name="field.name"
        :required="field.required"
      >
        <UCheckbox
          v-if="getFieldType(field.type) === 'checkbox'"
          v-model="props.values[field.name]"
          :disabled="!field.editable"
        />

        <UTextarea
          v-else-if="getFieldType(field.type) === 'textarea'"
          v-model="props.values[field.name]"
          :disabled="!field.editable"
          :rows="4"
        />

        <USelect
          v-else-if="getFieldType(field.type) === 'select'"
          v-model="props.values[field.name]"
          :disabled="!field.editable"
          :items="toSelectItems(field)"
          label-key="label"
          value-key="value"
        />

        <UInput
          v-else
          v-model="props.values[field.name]"
          class="w-full"
          :disabled="!field.editable"
          type="text"
        />
      </UFormField>

      <div v-if="props.editableFieldsCount === 0" class="text-muted text-sm">
        No editable profile fields are currently available.
      </div>

      <UButton
        :disabled="props.saving || !props.hasProfileSave"
        :loading="props.saving"
        type="submit"
      >
        Save Changes
      </UButton>
    </UForm>
  </div>
</template>
