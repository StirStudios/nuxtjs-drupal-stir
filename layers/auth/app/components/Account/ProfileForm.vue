<script setup lang="ts">
import type { EditorToolbarItem, FormError } from '@nuxt/ui'
import AccountSection from './Section.vue'
import { validateProfileValues } from '../../utils/profileValidation'

type ProfileField = {
  name: string
  label: string
  type: string
  required: boolean
  cardinality?: number
  editable: boolean
  options?: Record<string, string>
}

type ProfileFormConfig = {
  booleanControl?: 'checkbox' | 'switch'
  editorFields?: string[]
  fieldIcons?: Record<string, string>
}

const props = withDefaults(defineProps<{
  card?: boolean
  editableFieldsCount: number
  fields: ProfileField[]
  hasProfileSave: boolean
  heading?: string
  requiresCurrentPassword?: boolean
  saving: boolean
  submitClass?: string
  submitLabel?: string
  subheading?: string
  twoColumns?: boolean
  values: Record<string, unknown>
}>(), {
  card: true,
  heading: undefined,
  requiresCurrentPassword: false,
  submitClass: undefined,
  submitLabel: 'Save Changes',
  subheading: undefined,
  twoColumns: false,
})

const emit = defineEmits<{
  submit: []
}>()

const appConfig = useAppConfig()
const themeWebform = (
  (
    appConfig.stirTheme as {
      webform?: { fieldVariant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'; fieldInput?: string }
    }
  ).webform || {}
)
const profileFormConfig = (appConfig.authProfileForm || {}) as ProfileFormConfig

const getFieldType = (
  type: string,
): 'text' | 'textarea' | 'select' | 'boolean' => {
  if (type === 'text_long' || type === 'string_long') return 'textarea'
  if (type === 'boolean') return 'boolean'
  if (type === 'list_string' || type === 'list_integer' || type === 'entity_reference') return 'select'

  return 'text'
}

const isEditorField = (field: ProfileField): boolean =>
  (profileFormConfig.editorFields || []).includes(field.name)
  && ['text', 'text_long', 'string_long'].includes(field.type)

const usesSwitch = (field: ProfileField): boolean =>
  getFieldType(field.type) === 'boolean'
  && profileFormConfig.booleanControl === 'switch'

const shouldHideFieldLabel = (field: ProfileField): boolean =>
  usesSwitch(field) || isEditorField(field)

const getInputType = (field: ProfileField): 'email' | 'text' | 'url' => {
  if (field.type === 'email') return 'email'
  if (field.type === 'link') return 'url'

  return 'text'
}

const getInputIcon = (field: ProfileField): string | undefined =>
  profileFormConfig.fieldIcons?.[field.name]

const toSelectItems = (field: ProfileField): Array<{ label: string; value: string }> =>
  Object.entries(field.options || {}).map(([value, label]) => ({ label, value }))

const getStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)

  return ''
}
const getBooleanValue = (value: unknown): boolean => value === true
const isMultiValueField = (field: ProfileField): boolean => (field.cardinality || 1) > 1
const getSelectValue = (field: ProfileField, value: unknown): string | string[] =>
  isMultiValueField(field)
    ? (Array.isArray(value) ? value.map(entry => String(entry)) : [])
    : getStringValue(value)

const validate = (state: Record<string, unknown>): FormError[] => {
  const errors = validateProfileValues(props.fields, state)

  if (props.requiresCurrentPassword && !getStringValue(state.current_password)) {
    errors.push({
      name: 'current_password',
      message: 'Enter your current password to change your email address.',
    })
  }

  return errors
}

const formClass = computed(() =>
  props.twoColumns ? 'grid gap-5 md:grid-cols-2' : 'space-y-5',
)
const editorToolbarItems = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
  ],
  [
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } },
  ],
] satisfies EditorToolbarItem[][]
</script>

<template>
  <AccountSection
    :card="card"
    :heading="heading"
    :subheading="subheading"
  >
    <UForm
      :class="formClass"
      :state="values"
      :validate="validate"
      @submit="emit('submit')"
    >
      <UFormField
        v-for="field in fields"
        :key="field.name"
        :label="shouldHideFieldLabel(field) ? undefined : field.label"
        :name="field.name"
        :required="field.required"
      >
        <USwitch
          v-if="usesSwitch(field)"
          :disabled="!field.editable"
          :label="field.label"
          :model-value="getBooleanValue(values[field.name])"
          @update:model-value="values[field.name] = $event === true"
        />

        <UCheckbox
          v-else-if="getFieldType(field.type) === 'boolean'"
          :disabled="!field.editable"
          :model-value="getBooleanValue(values[field.name])"
          @update:model-value="values[field.name] = $event === true"
        />

        <UEditor
          v-else-if="isEditorField(field)"
          v-slot="{ editor }"
          class="min-h-36 w-full overflow-hidden rounded-md ring ring-default"
          content-type="html"
          :editable="field.editable"
          :model-value="getStringValue(values[field.name])"
          placeholder="Write a short bio..."
          :ui="{ base: 'min-h-28 p-3' }"
          @update:model-value="values[field.name] = String($event ?? '')"
        >
          <UEditorToolbar
            class="overflow-x-auto border-b border-default px-2 py-1"
            :editor="editor"
            :items="editorToolbarItems"
          />
        </UEditor>

        <UTextarea
          v-else-if="getFieldType(field.type) === 'textarea'"
          :class="themeWebform.fieldInput || 'w-full'"
          :disabled="!field.editable"
          :model-value="getStringValue(values[field.name])"
          :rows="4"
          :variant="themeWebform.fieldVariant"
          @update:model-value="values[field.name] = String($event ?? '')"
        />

        <USelect
          v-else-if="getFieldType(field.type) === 'select'"
          :class="themeWebform.fieldInput || 'w-full'"
          :disabled="!field.editable"
          :items="toSelectItems(field)"
          label-key="label"
          :model-value="getSelectValue(field, values[field.name])"
          :multiple="isMultiValueField(field)"
          value-key="value"
          :variant="themeWebform.fieldVariant"
          @update:model-value="values[field.name] = isMultiValueField(field) ? $event : String($event ?? '')"
        />

        <UInput
          v-else
          :class="themeWebform.fieldInput || 'w-full'"
          :disabled="!field.editable"
          :icon="getInputIcon(field)"
          :model-value="getStringValue(values[field.name])"
          :type="getInputType(field)"
          :variant="themeWebform.fieldVariant"
          @update:model-value="values[field.name] = String($event ?? '')"
        />
      </UFormField>

      <UFormField
        v-if="requiresCurrentPassword"
        description="Required to confirm your email address change."
        label="Current password"
        name="current_password"
        required
      >
        <UInput
          autocomplete="current-password"
          :class="themeWebform.fieldInput || 'w-full'"
          :model-value="getStringValue(values.current_password)"
          type="password"
          :variant="themeWebform.fieldVariant"
          @update:model-value="values.current_password = String($event ?? '')"
        />
      </UFormField>

      <div v-if="editableFieldsCount === 0" class="text-muted text-sm">
        No editable profile fields are currently available.
      </div>

      <UButton
        :class="submitClass || 'mt-5 w-fit md:col-span-2'"
        :disabled="saving || !hasProfileSave"
        :loading="saving"
        type="submit"
      >
        {{ submitLabel }}
      </UButton>
    </UForm>
  </AccountSection>
</template>
