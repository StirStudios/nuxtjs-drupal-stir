<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { transformOptions } from '#stir-webform/utils/transformUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string>
}>()

const transformedOptions = computed(() =>
  transformOptions(props.field['#options'] || {}),
)

</script>

<template>
  <URadioGroup
    v-model="state[fieldName]"
    class="form-input w-full"
    :items="transformedOptions"
    :orientation="field['#orientation'] === 'horizontal' ? 'horizontal' : 'vertical'"
  >
    <template #description="{ item }">
      <span class="mt-2 block whitespace-pre-line">{{ item.description }}</span>
    </template>
  </URadioGroup>
</template>
