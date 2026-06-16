<script setup lang="ts">
import type { WebformFieldProps } from '~/types'
import { inputIdInjectionKey } from '@nuxt/ui/composables'
import { resolveUiFieldVariant } from '~/utils/nuxtUiProps'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const { webform } = useAppConfig().stirTheme
const isMaterial = computed(() => webform.variant === 'material')
const fieldVariant = computed(() => resolveUiFieldVariant(webform.variant))
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
    :ui="props.floatingLabel ? { base: 'peer' } : {}"
    :variant="fieldVariant"
  >
    <label
      v-if="props.floatingLabel"
      :class="[isMaterial ? '' : 'px-1.5', webform.labels.base]"
      :for="id"
    >
      <span :class="[isMaterial ? '' : 'bg-default px-1', 'inline-flex']">
        {{ props.field['#title'] }}
      </span>
    </label>
  </UTextarea>
</template>
