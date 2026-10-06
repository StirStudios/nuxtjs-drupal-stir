<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '#stir/types'
import { transformOptions } from '#stir-webform/utils/transformUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

const answers = computed(() => transformOptions(props.field['#answers'] ?? {}))
const questions = computed(() => Object.entries(props.field['#questions'] ?? {}))
// Webform stores the answer to each question under the question's key.
const responses = computed(() => props.state[props.fieldName] as Record<string, string>)
</script>

<template>
  <div class="flex flex-col gap-4">
    <URadioGroup
      v-for="[key, question] in questions"
      :key="key"
      v-model="responses[key]"
      :items="answers"
      :legend="question"
      orientation="horizontal"
    />
  </div>
</template>
