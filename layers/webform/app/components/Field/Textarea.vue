<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { inputIdInjectionKey } from '@nuxt/ui/composables/useFormField'
import { resolveUiFieldVariant } from '#stir/utils/nuxtUiProps'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const webform = useStirWebformTheme()
const isMaterial = computed(() => webform.fieldVariant === 'material')
const textareaUi = computed(() => props.floatingLabel
  ? { base: ['peer', isMaterial.value ? 'pt-4!' : ''] }
  : {})
const fieldVariant = computed(() => resolveUiFieldVariant(webform.fieldVariant))
const injectedInputId = inject(inputIdInjectionKey, undefined)
const id = computed(() => injectedInputId?.value ?? props.fieldName)
</script>

<template>
  <UTextarea
    :id="id"
    v-model="props.state[props.fieldName]"
    autoresize
    :class="['w-full', webform.fieldText]"
    :placeholder="props.floatingLabel ? ' ' : ''"
    :rows="1"
    :ui="textareaUi"
    :variant="fieldVariant"
  >
    <label
      v-if="props.floatingLabel"
      :class="webform.labels.floatingClass"
      :for="id"
    >
      <span class="inline-flex rounded-sm bg-default pe-1">
        {{ props.field['#title'] }}
      </span>
    </label>
  </UTextarea>
</template>
