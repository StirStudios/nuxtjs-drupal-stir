<script setup lang="ts">
import type { FormError, FormErrorEvent } from '@nuxt/ui'
import type { WebformFieldProps, WebformState } from '#stir/types'
import type { WebformValidationSchema } from '#stir-webform/utils/buildValidationSchema'
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'
import { resolveUiSize, type UiSize } from '#stir/utils/nuxtUiProps'
import { hasLaterWizardPage, resolveWizardPages, wizardChoiceField, wizardPageFieldNames } from '#stir-webform/utils/webformWizard'

type WebformThemeConfig = {
  buttonClass?: string
  showToasts?: boolean
  submitButtonSize?: unknown
  formClass?: string
  fieldGroup?: string
  fieldGroupHeader?: string
  response?: string
  spacing?: string
  submitAlign?: string
  submitComponent?: string
  fieldVariant?: string
}

const props = defineProps<{
  fields: Record<string, WebformFieldProps>
  state: WebformState
  schema?: WebformValidationSchema
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
  submissionError?: string
  editLink?: string
  parentUuid?: string
}>()

const emit = defineEmits<{
  (e: 'submit', event: { data: Record<string, unknown> }): void
  (e: 'error', event: FormErrorEvent): void
  (e: 'update:turnstileToken', value: string): void
}>()

const form = useTemplateRef('form')
const pageHeading = useTemplateRef<HTMLElement>('pageHeading')

// Drupal Webform wizard pages: one page at a time, each validated before the
// next; the last page submits every value once. Pages hidden by conditions
// are skipped. Forms without wizard pages render all fields as before.
const wizardPages = computed(() =>
  resolveWizardPages(props.fields, props.orderedFieldNames, props.state),
)
const isWizard = computed(() => wizardPages.value.length > 0)
const rowOf = (fieldName: string): string | undefined => {
  const row = props.fields[fieldName]?.row

  return typeof row === 'string' ? row : undefined
}
const rowFields = (row: string) => props.orderedFieldNames.filter(name => rowOf(name) === row)
// Written out in full so Tailwind finds them; a phone stacks the row.
const rowColumns = (row: string) =>
  ['', '', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4'][rowFields(row).length] ?? 'sm:grid-cols-4'
const stepperItems = computed(() =>
  wizardPages.value.map((page, index) => ({
    value: index,
    title: page.title ?? `Step ${index + 1}`,
    disabled: index > pageIndex.value,
  })),
)
const pageIndex = ref(0)
const currentPage = computed(() =>
  wizardPages.value[Math.min(pageIndex.value, wizardPages.value.length - 1)],
)
const isLastPage = computed(
  () => !isWizard.value || (
    pageIndex.value >= wizardPages.value.length - 1
    && !hasLaterWizardPage(props.fields, props.orderedFieldNames, currentPage.value?.key, props.state)
  ),
)
const isOnCurrentPage = (fieldName: string) => {
  if (!isWizard.value) return true
  const page = (props.fields[fieldName] as { page?: { key: string } | null } | undefined)?.page

  return !page || page.key === currentPage.value?.key
}

async function goToPage(index: number) {
  pageIndex.value = index
  await nextTick()
  pageHeading.value?.focus()
}

// A page that asks a single radio question moves on as soon as it is answered.
const choiceField = computed(() => isWizard.value
  ? wizardChoiceField(props.fields, props.orderedFieldNames, currentPage.value?.key)
  : undefined)

watch(
  () => (choiceField.value ? props.state[choiceField.value] : undefined),
  (value, previous) => {
    if (value && value !== previous && !isLastPage.value) void nextPage()
  },
)

async function nextPage() {
  const names = wizardPageFieldNames(props.fields, props.orderedFieldNames, currentPage.value?.key)

  try {
    await form.value?.validate({ name: names, silent: false })
  } catch {
    // UForm shows the errors on the fields of this page.
    return
  }

  // Answers on this page may reveal the next one; with none left, submit.
  await nextTick()
  if (pageIndex.value + 1 < wizardPages.value.length) {
    await goToPage(pageIndex.value + 1)
  } else {
    form.value?.submit()
  }
}

const validateOn: Array<'blur' | 'change' | 'input'> = ['blur', 'change', 'input']
const trustedHtml = (value?: string) => trustedDrupalHtml(value)
const buttonSize = computed<UiSize>(() =>
  resolveUiSize(props.themeWebform.submitButtonSize, 'md'),
)
const submitDisabled = computed(
  () => !props.isSchemaReady || props.isLoading || !props.turnstileToken,
)
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

defineExpose({
  // Drupal's refusals, shown on the fields they concern.
  setErrors: (errors: FormError[]) => form.value?.setErrors(errors),
})
</script>

<template>
  <UForm
    v-if="!isFormSubmitted"
    ref="form"
    :class="[props.themeWebform.formClass, props.themeWebform.spacing]"
    novalidate
    :schema="schema"
    :state="state"
    :validate-on="validateOn"
    @error="emit('error', $event)"
    @submit="emit('submit', $event)"
  >
    <EditLink :link="editLink" :parent-uuid="parentUuid" />

    <div v-if="isWizard && currentPage" class="flex flex-col gap-4">
      <!-- Steps already passed can be revisited; later ones open with Next. -->
      <UStepper
        :items="stepperItems"
        :model-value="pageIndex"
        size="sm"
        @update:model-value="(index) => typeof index === 'number' && index < pageIndex && goToPage(index)"
      />
      <p aria-live="polite" class="sr-only">
        Step {{ pageIndex + 1 }} of {{ wizardPages.length }}
      </p>
      <h2
        v-if="currentPage.title"
        ref="pageHeading"
        :class="props.themeWebform.fieldGroupHeader"
        tabindex="-1"
      >
        {{ currentPage.title }}
      </h2>
    </div>

    <template v-for="fieldName in orderedFieldNames" :key="fieldName">
      <template
        v-if="
          isOnCurrentPage(fieldName) &&
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

      <!-- A Webform flexbox renders as one row, from its first field. -->
      <template v-else-if="isOnCurrentPage(fieldName) && shouldRenderIndividualField(fieldName) && rowOf(fieldName)">
        <div
          v-if="rowFields(rowOf(fieldName)!)[0] === fieldName"
          :class="['grid gap-x-4 gap-y-8', rowColumns(rowOf(fieldName)!)]"
        >
          <FieldRenderer
            v-for="rowFieldName in rowFields(rowOf(fieldName)!)"
            :key="rowFieldName"
            :field="fields[rowFieldName]!"
            :field-name="rowFieldName"
            :fields="fields"
            :ordered-field-names="orderedFieldNames"
            :state="state"
          />
        </div>
      </template>

      <template v-else-if="isOnCurrentPage(fieldName) && shouldRenderIndividualField(fieldName)">
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
      v-if="isLastPage"
      collapse-when-inactive
      :model-value="turnstileToken"
      @update:model-value="emit('update:turnstileToken', String($event ?? ''))"
    />

    <WrapDiv :align="props.themeWebform.submitAlign">
      <div v-if="isWizard" class="flex flex-wrap gap-3">
        <UButton
          v-if="pageIndex > 0"
          color="neutral"
          :label="currentPage?.prevLabel || 'Back'"
          :size="buttonSize"
          variant="outline"
          @click="goToPage(pageIndex - 1)"
        />
        <UButton
          v-if="!isLastPage"
          :class="props.themeWebform.buttonClass"
          :label="currentPage?.nextLabel || 'Next'"
          :size="buttonSize"
          @click="nextPage"
        />
      </div>
      <component
        :is="submitComponent"
        v-if="isLastPage && submitComponent"
        v-bind="submitComponentProps"
      />
      <UButton
        v-else-if="isLastPage"
        v-bind="submitButtonProps"
      />
    </WrapDiv>
    <!-- With toasts on, the toast reports a refusal instead. -->
    <p
      v-if="submissionError && themeWebform.showToasts === false"
      class="text-sm text-error"
      role="alert"
    >
      {{ submissionError }}
    </p>
  </UForm>

  <div v-else :class="themeWebform.response">
    <div class="prose" v-html="trustedHtml(webformConfirmation)" />
    <EditLink :link="editLink" :parent-uuid="parentUuid" />
  </div>
</template>
