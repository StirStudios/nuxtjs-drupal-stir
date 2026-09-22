<script setup lang="ts">
import type { ParagraphLayoutContract, ParagraphLayoutOption } from '#stir/types'

// The layout picker in quick settings. The parent owns the pending layout
// and the content moves, and resets the moves when another layout is chosen.
const props = defineProps<{
  layout: ParagraphLayoutContract
  option: ParagraphLayoutOption | null
  selected: string
  dirty: boolean
}>()

const mappings = defineModel<Record<string, string>>('mappings', { required: true })

const emit = defineEmits<{
  arrange: []
  select: [value: string]
}>()

const summary = computed(() => props.option?.label ?? 'Choose layout')
</script>

<template>
  <UCollapsible
    class="border-muted rounded-md border"
    :ui="{ content: 'border-t border-muted' }"
  >
    <template #default="{ open: layoutOpen }">
      <UButton
        block
        color="neutral"
        :icon="dirty ? 'i-lucide-layout-dashboard' : 'i-lucide-layout-template'"
        :label="`Layout · ${summary}`"
        :trailing-icon="layoutOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        :ui="{ base: 'justify-between rounded-md px-3 py-2' }"
        variant="ghost"
      />
    </template>

    <template #content>
      <div class="space-y-3 p-3">
        <URadioGroup
          :items="layout.options"
          :model-value="selected"
          orientation="horizontal"
          size="sm"
          :ui="{
            fieldset: 'grid grid-cols-2 gap-2',
            item: 'min-w-0',
            wrapper: 'min-w-0 w-full',
            label: 'w-full',
          }"
          value-key="value"
          variant="card"
          @update:model-value="emit('select', $event)"
        >
          <template #label="{ item }">
            <span class="flex min-w-0 flex-col gap-1.5">
              <span
                aria-hidden="true"
                class="border-muted flex h-8 flex-col gap-0.5 rounded-sm border p-1"
              >
                <span
                  v-for="(row, rowIndex) in (
                    item as ParagraphLayoutOption
                  ).iconMap"
                  :key="rowIndex"
                  class="flex min-h-0 flex-1 gap-0.5"
                >
                  <span
                    v-for="(region, regionIndex) in row"
                    :key="`${region}-${regionIndex}`"
                    class="bg-accented min-w-0 flex-1"
                  />
                </span>
              </span>
              <span class="truncate text-xs">{{ item.label }}</span>
            </span>
          </template>
        </URadioGroup>

        <UAlert
          v-if="dirty && option?.moves.length"
          color="warning"
          icon="i-lucide-move-right"
          title="Content movement"
          variant="subtle"
        >
          <template #description>
            <div class="mt-2 grid gap-3">
              <UFormField
                v-for="move in option.moves"
                :key="move.source"
                :label="`${move.sourceLabel} (${move.count})`"
              >
                <USelect
                  v-model="mappings[move.source]"
                  class="w-full"
                  :items="option.regions"
                  label-key="label"
                  size="sm"
                  value-key="value"
                />
              </UFormField>
            </div>
          </template>
        </UAlert>

        <UButton
          v-if="layout.children"
          block
          color="neutral"
          icon="i-lucide-panels-top-left"
          label="Arrange content"
          variant="soft"
          @click="emit('arrange')"
        />
      </div>
    </template>
  </UCollapsible>
</template>
