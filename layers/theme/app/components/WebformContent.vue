<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '~/types'
import type { ObjectSchema } from 'yup'
import { trustedDrupalHtml } from '~/utils/trustedDrupalHtml'
import { resolveUiSize, type UiSize } from '~/utils/nuxtUiProps'

type WebformThemeConfig = {
  buttonClass?: string
  submitButtonSize?: unknown
  formClass?: string
  fieldGroup?: string
  fieldGroupHeader?: string
  response?: string
  spacing?: string
  spacingLarge?: string
  submitAlign?: string
  submitComponent?: string
  fieldVariant?: string
}

const props = defineProps<{
  fields: Record<string, WebformFieldProps>
  state: WebformState
  schema?: ObjectSchema<Record<string, unknown>>
  isFormSubmitted: boolean
  isLoading: boolean
  isSchemaReady: boolean
  orderedFieldNames: string[]
  themeWebform: WebformThemeConfig
  groupedFields: Record<string, string[]>
  shouldRenderGroupContainer: (fieldName: string) => boolean
  shouldRenderIndividualField: (fieldName: string) => boolean
  getGroupFields: (parentName: string) => string[]
  isContainerVisible: (containerName: string) => boolean
  submitButtonLabel: string
  webformConfirmation: string
  turnstileToken: string
  editLink?: string
  parentUuid?: string
}>()

const emit = defineEmits<{
  (e: 'submit', event: { data: Record<string, unknown> }): void
  (e: 'error', event: unknown): void
  (e: 'update:turnstileToken', value: string): void
  (e: 'validation-activate'): void
}>()

const validateOn: Array<'blur' | 'change' | 'input'> = ['blur', 'change', 'input']
const trustedHtml = (value?: string) => trustedDrupalHtml(value)
const buttonSize = computed<UiSize>(() =>
  resolveUiSize(props.themeWebform.submitButtonSize, 'md'),
)
const submitDisabled = computed(() => !props.isSchemaReady || props.isLoading)
const nuxtApp = useNuxtApp()
const submitComponent = computed(() => {
  const componentName = props.themeWebform.submitComponent?.trim()

  if (!componentName) return null
  return nuxtApp.vueApp.component(componentName) ?? null
})
const submitComponentProps = computed(() => ({
  buttonClass: props.themeWebform.buttonClass,
  buttonSize: buttonSize.value,
  disabled: submitDisabled.value,
  isLoading: props.isLoading,
  label: props.submitButtonLabel,
  loading: props.isLoading,
  submitAlign: props.themeWebform.submitAlign,
}))
const submitButtonProps = computed(() => ({
  class: props.themeWebform.buttonClass,
  disabled: submitDisabled.value,
  label: props.submitButtonLabel,
  loading: props.isLoading,
  size: buttonSize.value,
  type: 'submit' as const,
}))
</script>

<template>
  <UForm
    v-if="!isFormSubmitted"
    :class="[
      props.themeWebform.formClass,
      props.themeWebform.fieldVariant === 'material'
        ? props.themeWebform.spacingLarge
        : props.themeWebform.spacing,
    ]"
    :schema="schema"
    :state="state"
    :validate-on="validateOn"
    @error="emit('error', $event)"
    @focusin.capture="emit('validation-activate')"
    @pointerdown.capture="emit('validation-activate')"
    @submit="emit('submit', $event)"
  >
    <EditLink :link="editLink" :parent-uuid="parentUuid" />

    <template v-for="fieldName in orderedFieldNames" :key="fieldName">
      <template
        v-if="
          shouldRenderGroupContainer(fieldName) &&
          isContainerVisible(String(fields[fieldName]?.parent ?? ''))
        "
      >
        <h2 :class="props.themeWebform.fieldGroupHeader">
          {{ fields[fieldName]?.parentTitle }}
        </h2>
        <div
          v-if="fields[fieldName]?.parentDescription"
          class="section-desc"
          v-html="trustedHtml(String(fields[fieldName]?.parentDescription ?? ''))"
        />
        <div :class="props.themeWebform.fieldGroup">
          <template
            v-for="groupedFieldName in getGroupFields(
              String(fields[fieldName]?.parent ?? ''),
            )"
            :key="groupedFieldName"
          >
            <FieldRenderer
              v-if="
                !fields[groupedFieldName]?.['#tabGroup'] ||
                groupedFields[String(fields[fieldName]?.parent ?? '')]?.find(
                  (name: string) =>
                    fields[name]?.['#tabGroup'] ===
                    fields[groupedFieldName]?.['#tabGroup'],
                ) === groupedFieldName
              "
              :field="fields[groupedFieldName]!"
              :field-name="groupedFieldName"
              :fields="fields"
              :ordered-field-names="orderedFieldNames"
              :state="state"
            />
          </template>
        </div>
      </template>

      <template v-else-if="shouldRenderIndividualField(fieldName)">
        <FieldRenderer
          v-if="!fields[fieldName]?.['#tabGroup']"
          :field="fields[fieldName]!"
          :field-name="fieldName"
          :fields="fields"
          :ordered-field-names="orderedFieldNames"
          :state="state"
        />
      </template>
    </template>

    <FieldTurnstile
      :model-value="turnstileToken"
      @update:model-value="emit('update:turnstileToken', String($event ?? ''))"
    />

    <WrapDiv :align="props.themeWebform.submitAlign">
      <component
        :is="submitComponent"
        v-if="submitComponent"
        v-bind="submitComponentProps"
      />
      <UButton
        v-else
        v-bind="submitButtonProps"
      />
    </WrapDiv>
  </UForm>

  <div v-else :class="themeWebform.response">
    <div class="prose" v-html="trustedHtml(webformConfirmation)" />
    <EditLink :link="editLink" :parent-uuid="parentUuid" />
  </div>
</template>
