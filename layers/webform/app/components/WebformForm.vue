<script setup lang="ts">
import { flattenWebformFields } from '#stir/utils/flattenWebformFields'
import { evaluateContainerVisibility } from '#stir/composables/useContainerVisibility'
import { transformPayloadToSnakeCase } from '#stir/utils/transformUtils'
import { getHiddenDefaults } from '#stir/utils/getHiddenDefaults'
import { useWindowScroll } from '@vueuse/core'
import {
  createScrollToTopRunner,
  getWebformScrollConfig,
} from '#stir/utils/webformScrollToTop'
import { resolveWebformRedirect } from '#stir/utils/webformRedirect'
import { evaluateCondition } from '#stir/utils/evaluateUtils'
import {
  buildWebformFormData,
  hasFileValue,
  isWebformFileField,
} from '#stir/utils/webformFileUtils'
import type {
  WebformDefinition,
  WebformFieldProps,
  WebformProps,
  WebformState,
} from '#stir/types'
import type { WebformValidationSchema } from '#stir/utils/buildValidationSchema'

type BuildValidationSchema = typeof import('#stir/utils/buildValidationSchema')['buildValidationSchema']

const props = defineProps<WebformProps>()
const webform = computed<WebformDefinition>(() => {
  return props.webform || ({} as WebformDefinition)
})

const { y } = useWindowScroll()
const toast = useToast()
const { webform: themeWebform } = useAppConfig().stirTheme
const { onError } = useValidation({
  showToast: themeWebform.showToasts !== false,
})
const shouldShowToasts = computed(() => themeWebform.showToasts !== false)

const webformScrollConfig = computed(() => getWebformScrollConfig(themeWebform))
const scrollToTopRunner = createScrollToTopRunner({
  y,
  getDelayMs: () => webformScrollConfig.value.scrollToTopDelayMs,
  getFallbackDelayMs: () =>
    webformScrollConfig.value.scrollToTopFallbackDelayMs,
})

onUnmounted(() => {
  scrollToTopRunner.cleanup()
})
const {
  fields: rawFields = {},
  webformId = '',
  webformSubmissions = '',
  webformConfirmation = '',
  webformConfirmationType = '',
  webformRedirect = null,
  actions = [],
} = webform.value

const fields = flattenWebformFields(rawFields)
const state = reactive<WebformState>({})
const orderedFieldNames = computed(() => Object.keys(fields))

const turnstileToken = ref('')
const isFormSubmitted = ref(false)
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const schema = shallowRef<WebformValidationSchema>()
const isSchemaReady = ref(false)
let buildSchema: BuildValidationSchema | undefined
let schemaLoadPromise: Promise<void> | undefined
const visibilitySignature = computed(() =>
  orderedFieldNames.value
    .map((fieldName) =>
      evaluateCondition(fields[fieldName]?.['#states']?.visible, state, true)
        ? '1'
        : '0',
    )
    .join(''),
)

watch(
  visibilitySignature,
  () => {
    if (buildSchema) schema.value = buildSchema(fields, state)
  },
  { flush: 'post' },
)

function requestSchema(): void {
  void ensureSchemaReady().catch((error: unknown) => {
    console.error('Unable to load webform validation:', error)
  })
}

async function ensureSchemaReady(): Promise<void> {
  if (isSchemaReady.value) return

  schemaLoadPromise ??= import('#stir/utils/buildValidationSchema')
    .then((module) => {
      buildSchema = module.buildValidationSchema
      schema.value = buildSchema(fields, state)
      isSchemaReady.value = true
    })
    .catch((error: unknown) => {
      schemaLoadPromise = undefined
      throw error
    })

  await schemaLoadPromise
}

onMounted(requestSchema)
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
  const type = String(field['#type'] ?? '')
    .trim()
    .toLowerCase()
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

const getFieldDefaultValue = (
  field: WebformFieldProps,
): WebformState[string] => {
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

  if (isWebformFileField(field)) return multiple ? [] : undefined
  if (type === 'checkboxes' || multiple) return []
  if (type === 'checkbox') return false
  if (isRangeLikeField(field)) {
    const minValue = Number(field['#min'])

    return Number.isFinite(minValue) ? Math.max(1, minValue) : 1
  }

  return ''
}

const resetFormState = (resetOptions: { bumpKey?: boolean } = {}) => {
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

  if (resetOptions.bumpKey !== false) {
    formResetKey.value += 1
  }
}

resetFormState({ bumpKey: false })

const containerTypes = ['section', 'fieldset', 'details', 'webform_section']
const shouldRenderGroupContainer = (fieldName: string) =>
  !!(
    fields[fieldName]?.parent &&
    groupedFields.value[fields[fieldName]?.parent]?.[0] === fieldName &&
    !containerTypes.includes(fields[fieldName]['#type'])
  )

const getGroupFields = (parentName: string) =>
  groupedFields.value[parentName] || []

const shouldRenderIndividualField = (fieldName: string) =>
  !fields[fieldName]?.parent &&
  (fields[fieldName]
    ? !containerTypes.includes(fields[fieldName]['#type'])
    : false)

const isContainerVisible = (containerName: string) =>
  evaluateContainerVisibility(containerName, state, fields, getGroupFields)

const wrapStyles = computed(() => [props.width, props.spacing].filter((value): value is string => typeof value === 'string' && value.length > 0))

const handleResetSubmission = async () => {
  isFormSubmitted.value = false
  await nextTick()
  formResetKey.value += 1

  if (webformScrollConfig.value.scrollToTopOnReset) {
    scrollToTopRunner.run()
  }
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
    const body = hasFileValue(payload)
      ? buildWebformFormData(payload)
      : JSON.stringify(payload)

    await $fetch('/api/webform/submit', {
      method: 'POST',
      body,
    })

    if (webformScrollConfig.value.scrollToTopOnSuccess) {
      scrollToTopRunner.run()
    }
    if (shouldShowToasts.value) {
      toast.add({
        title: 'Success!',
        description: 'Form submitted successfully!',
        color: 'success',
      })
    }
    props.onClose?.()

    const redirectTarget = resolveWebformRedirect(
      webformConfirmationType,
      webformRedirect,
    )

    if (redirectTarget) {
      await navigateTo(redirectTarget.to, { external: redirectTarget.external })
      return
    }

    resetFormState({ bumpKey: false })
    errors.value = {}
    turnstileToken.value = ''
    isFormSubmitted.value = true
  } catch (error) {
    console.error('Submission Error:', error)
    const errorData = (
      error as { response?: { _data?: Record<string, unknown> } }
    )?.response?._data as
      | {
          error?: { message?: string }
          message?: string
        }
      | undefined

    const errorMessage =
      errorData?.error?.message ||
      errorData?.message ||
      'Form submission failed. Please try again.'

    if (shouldShowToasts.value) {
      toast.add({
        title: 'Error',
        description: `Error submitting form: ${errorMessage}`,
        color: 'error',
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <WrapDiv :align="props.align" :styles="wrapStyles">
    <WebformContent
      :key="formResetKey"
      v-model:turnstile-token="turnstileToken"
      :edit-link="webformSubmissions || undefined"
      :fields="fields"
      :get-group-fields="getGroupFields"
      :grouped-fields="groupedFields"
      :is-container-visible="isContainerVisible"
      :is-form-submitted="isFormSubmitted"
      :is-loading="isLoading"
      :is-schema-ready="isSchemaReady"
      :ordered-field-names="orderedFieldNames"
      :parent-uuid="parentUuid"
      :schema="schema"
      :should-render-group-container="shouldRenderGroupContainer"
      :should-render-individual-field="shouldRenderIndividualField"
      :state="state"
      :submit-button-label="submitButtonLabel"
      :theme-webform="themeWebform"
      :webform-confirmation="webformConfirmation"
      @error="onError($event as never)"
      @reset-submission="handleResetSubmission"
      @submit="onSubmit"
    />
  </WrapDiv>
</template>
