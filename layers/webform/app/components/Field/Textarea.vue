<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { inputIdInjectionKey } from '@nuxt/ui/composables/useFormField'
import { showsCharacterCount, textMaxLength } from '#stir/utils/formInputUtils'
import { resolveUiFieldVariant } from '#stir/utils/nuxtUiProps'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const webform = useStirWebformTheme()
const textareaUi = computed(() => props.floatingLabel
  ? { base: webform.floatingControlClass }
  : {})
const fieldVariant = computed(() => resolveUiFieldVariant(webform.fieldVariant))
const injectedInputId = inject(inputIdInjectionKey, undefined)
const id = computed(() => injectedInputId?.value ?? props.fieldName)
// Drupal's #rows sets the starting height; autoresize grows from there.
const isRequired = computed(() => props.field['#required'] === true)
const rows = computed(() => Number(props.field['#rows']) || 1)
const maxLength = computed(() => textMaxLength(props.field))
const length = computed(() => String(props.state[props.fieldName] ?? '').length)
</script>

<template>
  <UTextarea
    :id="id"
    v-model="props.state[props.fieldName]"
    :aria-required="isRequired || undefined"
    autoresize
    :class="['w-full', webform.fieldText]"
    :maxlength="maxLength"
    :placeholder="props.floatingLabel ? ' ' : ''"
    :rows="rows"
    :ui="textareaUi"
    :variant="fieldVariant"
  >
    <label
      v-if="props.floatingLabel"
      :class="[webform.labels.floatingClass, isRequired && webform.labels.requiredClass]"
      :for="id"
    >
      <span class="inline-flex">
        {{ props.field['#title'] }}
      </span>
    </label>
    <template v-if="showsCharacterCount(length, maxLength)" #trailing>
      <span class="text-xs text-muted tabular-nums" role="status">
        {{ length }}/{{ maxLength }}
      </span>
    </template>
  </UTextarea>
</template>
