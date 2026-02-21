<script setup lang="ts">
import { flattenWebformFields } from '~/utils/flattenWebformFields'
import { webformState } from '~/composables/useWebformState'
import { evaluateContainerVisibility } from '~/composables/useContainerVisibility'
import { transformPayloadToSnakeCase } from '~/utils/transformUtils'
import { getHiddenDefaults } from '~/utils/getHiddenDefaults'
import { useValidation } from '~/composables/useValidation'
import { useWindowScroll } from '@vueuse/core'
import { evaluateCondition } from '~/utils/evaluateUtils'
import { buildYupSchema } from '~/utils/buildYupSchema'
import type { WebformDefinition, WebformFieldProps, WebformState } from '../../../../types'
import type { ObjectSchema } from 'yup'

const props = defineProps<{
  id?: number
  uuid?: string
  parentUuid?: string
  region?: string
  webform?: WebformDefinition
  align?: string
  width?: string
  spacing?: string
  editLink?: string
  onClose?: () => void
}>()
const webform = computed<WebformDefinition>(() => {
  return props.webform || ({} as WebformDefinition)
})

const { onError } = useValidation()
const { y } = useWindowScroll()
const toast = useToast()
const { webform: themeWebform } = useAppConfig().stirTheme
const {
  fields: rawFields = {},
  webformId = '',
  webformSubmissions = '',
  webformConfirmation = '',
  actions = [],
} = webform.value

const fields = flattenWebformFields(rawFields)
const state = reactive<WebformState>({})
const orderedFieldNames = computed(() => Object.keys(fields))

webformState.fields = fields
webformState.state = state

const turnstileToken = ref('')
const isFormSubmitted = ref(false)
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const schema = shallowRef<ObjectSchema<Record<string, unknown>>>(buildYupSchema(fields, state))
const isSchemaReady = ref(true)
const visibilitySignature = computed(() =>
  orderedFieldNames.value
    .map((fieldName) =>
      evaluateCondition(fields[fieldName]?.['#states']?.visible, state, true)
        ? '1'
        : '0',
    )
    .join(''),
)

watch(visibilitySignature, () => {
  schema.value = buildYupSchema(fields, state)
}, { flush: 'post' })
const submitButtonLabel = computed(
  () => actions[0]?.['#submit_Label'] || 'Submit',
)

const groupedFields = computed(() => {
  return orderedFieldNames.value.reduce(
    (acc, fieldName) => {
      const parent = fields[fieldName]?.parent

      if (parent) {
        if (!acc[parent]) acc[parent] = []
        acc[parent].push(fieldName)
      }
      return acc
    },
    {} as Record<string, string[]>,
  )
})

const formResetKey = ref(0)
const isRangeLikeField = (field: WebformFieldProps) => {
  const type = String(field['#type'] ?? '').trim().toLowerCase()
  const inputType = String(
    field['#input_type'] ??
      field['#inputType'] ??
      field['#widget'] ??
      (field['#attributes'] as Record<string, unknown> | undefined)?.type ??
      '',
  )
    .trim()
    .toLowerCase()

  return (
    type === 'range' ||
    type.includes('range') ||
    (type === 'number' && inputType === 'range')
  )
}

const getFieldDefaultValue = (field: WebformFieldProps): WebformState[string] => {
  const defaultValue =
    field['#default'] ?? field['#defaultValue'] ?? field['#default_value']

  if (defaultValue !== undefined && defaultValue !== null) {
    if (Array.isArray(defaultValue)) return [...defaultValue]
    if (typeof defaultValue === 'object') {
      return { ...(defaultValue as Record<string, unknown>) }
    }
    if (
      typeof defaultValue === 'string' ||
      typeof defaultValue === 'number' ||
      typeof defaultValue === 'boolean'
    ) {
      return defaultValue
    }
    return ''
  }

  const type = field['#type']
  const multipleCount = Number(field['#multiple'])
  const multiple =
    field['#multiple'] === true ||
    (Number.isFinite(multipleCount) && multipleCount > 1) ||
    (typeof field['#cardinality'] === 'number' && field['#cardinality'] !== 1)

  if (type === 'checkboxes' || multiple) return []
  if (type === 'checkbox') return false
  if (isRangeLikeField(field)) {
    const minValue = Number(field['#min'])

    return Number.isFinite(minValue) ? Math.max(1, minValue) : 1
  }

  return ''
}

const resetFormState = (options: { bumpKey?: boolean } = {}) => {
  for (const [key, field] of Object.entries(fields)) {
    const composite =
      typeof field['#composite'] === 'object' && field['#composite'] !== null
        ? field['#composite']
        : undefined

    if (composite) {
      state[key] = {} as Record<string, unknown>
      const compositeState = state[key] as Record<string, unknown>

      for (const [subKey, subField] of Object.entries(composite)) {
        compositeState[subKey] = subField['#value'] || ''
      }
    } else {
      state[key] = getFieldDefaultValue(field)
    }
  }

  if (options.bumpKey !== false) {
    formResetKey.value += 1
  }
}

resetFormState({ bumpKey: false })

const containerTypes = ['section', 'fieldset', 'details', 'webform_section']
const shouldRenderGroupContainer = (fieldName: string) =>
  fields[fieldName]?.parent &&
  groupedFields.value[fields[fieldName]?.parent]?.[0] === fieldName &&
  !containerTypes.includes(fields[fieldName]['#type'])

const getGroupFields = (parentName: string) =>
  groupedFields.value[parentName] || []

const shouldRenderIndividualField = (fieldName: string) =>
  !fields[fieldName]?.parent &&
  (fields[fieldName] ? !containerTypes.includes(fields[fieldName]['#type']) : false)

const isContainerVisible = (containerName: string) =>
  evaluateContainerVisibility(containerName, state, fields, getGroupFields)

const handleResetSubmission = async () => {
  isFormSubmitted.value = false
  y.value = 0
  await nextTick()
  formResetKey.value += 1
}

async function onSubmit(_event: { data: Record<string, unknown> }) {
  isLoading.value = true
  errors.value = {}

  try {
    const hiddenDefaults = getHiddenDefaults(fields)
    const payload = {
      webform_id: webformId,
      ...transformPayloadToSnakeCase(state),
      ...transformPayloadToSnakeCase(hiddenDefaults),
      turnstile_response: turnstileToken.value,
    }

    await $fetch('/api/webform/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (themeWebform.scrollToTopOnSuccess !== false) {
      y.value = 0
    }
    toast.add({
      title: 'Success!',
      description: 'Form submitted successfully!',
      color: 'success',
    })
    props.onClose?.()

    resetFormState({ bumpKey: false })
    errors.value = {}
    turnstileToken.value = ''
    isFormSubmitted.value = true
  } catch (error) {
    console.error('Submission Error:', error)
    const errorData = (error as { response?: { _data?: Record<string, unknown> } })
      ?.response?._data as
      | {
          error?: { message?: string }
          message?: string
        }
      | undefined

    const errorMessage =
      errorData?.error?.message ||
      errorData?.message ||
      'Form submission failed. Please try again.'

    toast.add({
      title: 'Error',
      description: `Error submitting form: ${errorMessage}`,
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <EditLink :link="webformSubmissions">
    <WrapDiv :align="props.align" :styles="[props.width, props.spacing]">
      <WebformContent
        :key="formResetKey"
        v-model:turnstile-token="turnstileToken"
        :fields="fields"
        :get-group-fields="getGroupFields"
        :grouped-fields="groupedFields"
        :is-container-visible="isContainerVisible"
        :is-form-submitted="isFormSubmitted"
        :is-loading="isLoading"
        :is-schema-ready="isSchemaReady"
        :ordered-field-names="orderedFieldNames"
        :schema="schema"
        :should-render-group-container="shouldRenderGroupContainer"
        :should-render-individual-field="shouldRenderIndividualField"
        :state="state"
        :submit-button-label="submitButtonLabel"
        :theme-webform="themeWebform"
        :webform-confirmation="webformConfirmation"
        @error="onError"
        @reset-submission="handleResetSubmission"
        @submit="onSubmit"
      />
    </WrapDiv>
  </EditLink>
</template>
