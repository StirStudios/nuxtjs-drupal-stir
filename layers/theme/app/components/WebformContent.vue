<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '~/types'
import type { ObjectSchema } from 'yup'
import { cleanHTML } from '~/utils/cleanHTML'

const props = defineProps<{
  fields: Record<string, WebformFieldProps>
  state: WebformState
  schema: ObjectSchema<Record<string, unknown>>
  isFormSubmitted: boolean
  isLoading: boolean
  isSchemaReady: boolean
  orderedFieldNames: string[]
  themeWebform: Record<string, string>
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
}>()

const validateOn: Array<'blur' | 'change' | 'input'> = ['blur', 'change', 'input']
const safeHtml = (value?: string) => cleanHTML(value ?? '')
const buttonSize = computed<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | undefined>(
  () => {
    const size = props.themeWebform.buttonSize

    return typeof size === 'string' && ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(size)
      ? (size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')
      : undefined
  },
)
</script>

<template>
  <UForm
    v-if="!isFormSubmitted"
    :class="
      props.themeWebform.variant === 'material'
        ? props.themeWebform.spacingLarge
        : props.themeWebform.spacing
    "
    :schema="schema"
    :state="state"
    :validate-on="validateOn"
    @error="emit('error', $event)"
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
          v-html="safeHtml(String(fields[fieldName]?.parentDescription ?? ''))"
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
      <UButton
        :disabled="!isSchemaReady || isLoading"
        :label="submitButtonLabel"
        :loading="isLoading"
        :size="buttonSize"
        type="submit"
      />
    </WrapDiv>
  </UForm>

  <div v-else :class="themeWebform.response">
    <div class="prose" v-html="safeHtml(webformConfirmation)" />
    <EditLink :link="editLink" :parent-uuid="parentUuid" />
  </div>
</template>
