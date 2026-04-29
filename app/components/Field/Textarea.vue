<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'
import { inputIdInjectionKey } from '@nuxt/ui/composables'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string | number>
  floatingLabel?: boolean
}>()

const { webform } = useAppConfig().stirTheme
const isMaterial = computed(() => webform.variant === 'material')
const injectedInputId = inject(inputIdInjectionKey, undefined)
const id = computed(() => injectedInputId?.value ?? props.fieldName)
</script>

<template>
  <UTextarea
    :id="id"
    v-model="props.state[props.fieldName]"
    autoresize
    class="w-full"
    :placeholder="props.floatingLabel ? ' ' : ''"
    :rows="1"
    :ui="props.floatingLabel ? { base: 'peer' } : {}"
    :variant="webform.variant"
  >
    <label
      v-if="props.floatingLabel"
      :class="[isMaterial ? '' : 'px-1.5', webform.labels.base]"
      :for="id"
    >
      <span :class="[isMaterial ? '' : 'px-1', 'bg-default inline-flex']">
        {{ props.field['#title'] }}
      </span>
    </label>
  </UTextarea>
</template>
