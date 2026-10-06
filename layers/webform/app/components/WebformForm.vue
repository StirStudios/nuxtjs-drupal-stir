<script setup lang="ts">
import { flattenWebformFields } from '#stir-webform/utils/flattenWebformFields'
import { evaluateContainerVisibility } from '#stir-webform/composables/useContainerVisibility'
import { serializeWebformSubmission } from '#stir-webform/utils/transformUtils'
import { getHiddenDefaults } from '#stir/utils/getHiddenDefaults'
import { resolveAlignClasses, resolveWidthClasses } from '#stir/utils/gridClasses'
import { useWindowScroll } from '@vueuse/core'
import {
  createScrollToTopRunner,
  getWebformScrollConfig,
} from '#stir-webform/utils/webformScrollToTop'
import { resolveWebformRedirect } from '#stir-webform/utils/webformRedirect'
import { resolveWebformFieldStates } from '#stir-webform/utils/webformConditions'
import { createWebformState } from '#stir-webform/utils/webformState'
import { isWebformContainer } from '#stir-webform/utils/webformFieldTypes'
import {
  buildWebformFormData,
  hasFileValue,
} from '#stir-webform/utils/webformFileUtils'
import type {
  WebformDefinition,
  WebformProps,
  WebformState,
} from '#stir/types'
import type { WebformValidationSchema } from '#stir-webform/utils/buildValidationSchema'
import {
  normalizeWebformDefinition,
} from '#stir-webform/utils/webformFieldUtils'

type BuildValidationSchema = typeof import('#stir-webform/utils/buildValidationSchema')['buildValidationSchema']

const props = defineProps<WebformProps>()
const webform = computed<WebformDefinition>(() =>
  normalizeWebformDefinition(props.webform),
)

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
// The last refusal, for forms that show it inline instead of as a toast.
const submissionError = ref('')
const schema = shallowRef<WebformValidationSchema>()
const isSchemaReady = ref(false)
let buildSchema: BuildValidationSchema | undefined
let schemaLoadPromise: Promise<void> | undefined
// Validation follows what conditions currently show and require.
const visibilitySignature = computed(() =>
  orderedFieldNames.value
    .map((fieldName) => {
      const field = fields[fieldName]

      if (!field) return '00'

      const { visible, required } = resolveWebformFieldStates(field, state)

      return `${visible ? 1 : 0}${required ? 1 : 0}`
    })
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

  schemaLoadPromise ??= import('#stir-webform/utils/buildValidationSchema')
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
  () => actions[0]?.['#submitLabel'] || 'Submit',
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
const resetFormState = (resetOptions: { bumpKey?: boolean } = {}) => {
  Object.assign(state, createWebformState(fields))

  if (resetOptions.bumpKey !== false) {
    formResetKey.value += 1
  }
}

resetFormState({ bumpKey: false })

const shouldRenderGroupContainer = (fieldName: string) =>
  !!(
    fields[fieldName]?.parent &&
    groupedFields.value[fields[fieldName]?.parent]?.[0] === fieldName &&
    !isWebformContainer(fields[fieldName])
  )

const getGroupFields = (parentName: string) =>
  groupedFields.value[parentName] || []

const shouldRenderIndividualField = (fieldName: string) =>
  !fields[fieldName]?.parent &&
  (fields[fieldName]
    ? !isWebformContainer(fields[fieldName])
    : false)

const isContainerVisible = (containerName: string) =>
  evaluateContainerVisibility(containerName, state, fields, getGroupFields)

const alignClasses = computed(() => resolveAlignClasses(props.align))
const wrapStyles = computed(() =>
  ['w-full', resolveWidthClasses(props.width, props.align), props.spacing].filter(
    (value): value is string =>
      typeof value === 'string' && value.length > 0,
  ),
)

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
  submissionError.value = ''

  try {
    const hiddenDefaults = getHiddenDefaults(fields)
    const payload = {
      webform_id: webformId,
      ...serializeWebformSubmission(state),
      ...serializeWebformSubmission(hiddenDefaults),
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
    // Drupal spent the token; clearing it asks FieldTurnstile for a fresh one.
    // The form stays mounted, so the visitor keeps their place.
    turnstileToken.value = ''
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

    submissionError.value = `Error submitting form: ${errorMessage}`

    if (shouldShowToasts.value) {
      toast.add({
        title: 'Error',
        description: submissionError.value,
        color: 'error',
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <WrapDiv :align="alignClasses" :styles="wrapStyles">
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
      :submission-error="submissionError"
      :submit-button-label="submitButtonLabel"
      :theme-webform="themeWebform"
      :webform-confirmation="webformConfirmation"
      @error="onError"
      @reset-submission="handleResetSubmission"
      @submit="onSubmit"
    />
  </WrapDiv>
</template>
