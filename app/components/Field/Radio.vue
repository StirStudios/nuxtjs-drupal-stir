<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'
import { transformOptions } from '~/utils/transformUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string>
}>()

const transformedOptions = computed(() =>
  transformOptions(props.field['#options'] || {}),
)

onMounted(() => {
  if (props.state[props.fieldName] === undefined) {
    props.state[props.fieldName] = ''
  }
})
</script>

<template>
  <URadioGroup
    v-model="state[fieldName]"
    class="form-input w-full"
    :items="transformedOptions"
    orientation="horizontal"
  >
    <template #description="{ item }">
      <span class="mt-2 block whitespace-pre-line">{{ item.description }}</span>
    </template>
  </URadioGroup>
</template>
