<script setup lang="ts">
import type {
  ParagraphPresentationField,
  ParagraphPresentationKey,
} from '#stir/types'
import { adminUiTheme } from '../../../utils/adminUiTheme'

// The quick presentation settings, grouped by field group. Values are owned
// by the parent, which tracks what changed since the last save.
defineProps<{
  fields: ParagraphPresentationField[]
}>()

const emit = defineEmits<{
  update: [key: ParagraphPresentationKey, value: boolean | string | string[]]
}>()

function selectableOptions(field: ParagraphPresentationField) {
  return field.options?.filter((option) => option.value !== '') ?? []
}
</script>

<template>
  <div class="grid grid-cols-2 gap-x-3 gap-y-4">
    <template v-for="(field, index) in fields" :key="field.key">
      <USeparator
        v-if="index > 0 && field.group !== fields[index - 1]?.group"
        class="admin-ui-settings-separator col-span-2"
      />
      <UFormField :label="field.label">
        <template v-if="field.description" #label>
          <span class="inline-flex items-center gap-1">
            <span>{{ field.label }}</span>
            <UTooltip
              :text="field.description"
              :ui="{
                content: `${adminUiTheme.tooltip.content} max-w-64`,
              }"
            >
              <UButton
                :aria-label="`About ${field.label}`"
                color="neutral"
                icon="i-lucide-circle-help"
                size="xs"
                :ui="{ base: 'min-h-0 p-0 text-muted' }"
                variant="link"
              />
            </UTooltip>
          </span>
        </template>
        <USwitch
          v-if="field.type === 'boolean'"
          :model-value="field.value as boolean"
          @update:model-value="(value) => emit('update', field.key, value)"
        />
        <USelectMenu
          v-else-if="field.type === 'select'"
          class="w-full"
          clear
          :items="selectableOptions(field)"
          label-key="label"
          :model-value="field.value as string"
          placeholder="- None -"
          size="sm"
          value-key="value"
          @update:model-value="(value) => emit('update', field.key, value ?? '')"
        />
        <USelectMenu
          v-else
          class="w-full"
          clear
          :items="selectableOptions(field)"
          label-key="label"
          :model-value="field.value as string[]"
          multiple
          placeholder="- None -"
          size="sm"
          value-key="value"
          @update:model-value="(value) => emit('update', field.key, value ?? [])"
        />
      </UFormField>
    </template>
  </div>
</template>
