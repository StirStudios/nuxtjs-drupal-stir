<script setup lang="ts">
import type { Component } from 'vue'
import type { WebformFieldProps, WebformState } from '#stir/types'
import { maxWebformValues } from '#stir-webform/utils/webformFieldTypes'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
  component: Component
}>()

// Webform stores a list; each input edits one item of it.
const values = computed(() => props.state[props.fieldName] as unknown as WebformState)
const count = computed(() => Math.max(1, (props.state[props.fieldName] as string[] | undefined)?.length ?? 0))
const canAdd = computed(() => count.value < maxWebformValues(props.field))
const itemField = computed(() => ({ ...props.field, '#multiple': false }))

function add(): void {
  (props.state[props.fieldName] as string[]).push('')
}

function remove(index: number): void {
  (props.state[props.fieldName] as string[]).splice(index, 1)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="index in count" :key="index" class="flex items-start gap-2">
      <!-- Each value gets its own input id and accessible name. -->
      <UFormField
        class="flex-1"
        :label="`${field['#title'] || fieldName} ${index}`"
        :name="`${fieldName}.${index - 1}`"
        :ui="{ label: 'sr-only' }"
      >
        <component
          :is="component"
          :field="itemField"
          :field-name="String(index - 1)"
          :floating-label="false"
          :state="values"
        />
      </UFormField>
      <UButton
        v-if="count > 1"
        :aria-label="`Remove ${field['#title'] || 'value'} ${index}`"
        color="neutral"
        icon="i-lucide-x"
        variant="ghost"
        @click="remove(index - 1)"
      />
    </div>
    <UButton
      v-if="canAdd"
      class="self-start"
      color="neutral"
      icon="i-lucide-plus"
      :label="`Add another ${String(field['#title'] || 'value').toLowerCase()}`"
      size="sm"
      variant="link"
      @click="add"
    />
  </div>
</template>
