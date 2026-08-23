<script setup lang="ts">
import type {
  ParagraphLayoutChild,
  ParagraphLayoutContract,
  ParagraphLayoutOption,
  ParagraphPresentationResponse,
} from '#stir/types'
import {
  createParagraphLayoutArrangement,
  serializeParagraphLayoutArrangement,
} from '#stir/utils/paragraphLayoutArrangement'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  contract: ParagraphLayoutContract
  endpoint: string
  open: boolean
}>()

const emit = defineEmits<{
  saved: [response: ParagraphPresentationResponse]
  'update:open': [value: boolean]
}>()

const toast = useToast()
const selectedLayout = ref(props.contract.current)
const saving = ref(false)
const error = ref('')
const announcement = ref('')
const arrangement = ref<Record<string, ParagraphLayoutChild[]>>({})

const selectedOption = computed(() => props.contract.options.find(
  option => option.value === selectedLayout.value,
) ?? props.contract.options[0])

function childrenFor(region: string): ParagraphLayoutChild[] {
  return arrangement.value[region] ?? []
}

function resetArrangement(option: ParagraphLayoutOption): void {
  arrangement.value = createParagraphLayoutArrangement(props.contract, option)
}

function updateRegion(region: string, children: ParagraphLayoutChild[]): void {
  arrangement.value[region] = children
}

function chooseLayout(value: string): void {
  const option = props.contract.options.find(candidate => candidate.value === value)

  if (!option) return
  selectedLayout.value = value
  resetArrangement(option)
  announcement.value = `${option.label} selected. Content has been placed using Drupal’s suggested regions.`
}

function locate(uuid: string): { region: string, index: number } | null {
  for (const region of selectedOption.value?.regions ?? []) {
    const index = childrenFor(region.value).findIndex(child => child.uuid === uuid)

    if (index >= 0) return { region: region.value, index }
  }
  return null
}

function moveWithin(child: ParagraphLayoutChild, direction: -1 | 1): void {
  const location = locate(child.uuid)

  if (!location) return
  const values = childrenFor(location.region)
  const target = location.index + direction

  if (target < 0 || target >= values.length) return
  values.splice(target, 0, values.splice(location.index, 1)[0]!)
  announcement.value = `${child.label} moved ${direction < 0 ? 'up' : 'down'}.`
}

function moveToRegion(child: ParagraphLayoutChild, destination: string): void {
  const location = locate(child.uuid)

  if (!location || location.region === destination) return
  const [moved] = childrenFor(location.region).splice(location.index, 1)

  if (!moved) return
  moved.region = destination
  childrenFor(destination).push(moved)
  const label = selectedOption.value?.regions.find(region => region.value === destination)?.label ?? destination

  announcement.value = `${child.label} moved to ${label}.`
}

function regionPayload(): Record<string, string[]> {
  return selectedOption.value
    ? serializeParagraphLayoutArrangement(selectedOption.value, arrangement.value)
    : {}
}

async function save(): Promise<void> {
  if (saving.value || !selectedOption.value) return
  saving.value = true
  error.value = ''
  try {
    const response = await $fetch<ParagraphPresentationResponse>(props.endpoint, {
      method: 'POST',
      body: {
        values: {},
        layout: {
          target: selectedLayout.value,
          mappings: {},
          regions: regionPayload(),
          expectedOwnerRevisionId: props.contract.ownerRevisionId,
        },
      },
    })

    toast.add({
      title: 'Layout arrangement saved',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })
    emit('saved', response)
    emit('update:open', false)
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to save the layout arrangement.'
  }
  finally {
    saving.value = false
  }
}

watch(() => props.open, (value) => {
  if (!value) return

  selectedLayout.value = props.contract.current
  resetArrangement(selectedOption.value!)
  error.value = ''
  announcement.value = ''
})
</script>

<template>
  <ClientOnly>
    <UModal
      :description="'Choose a layout, then drag or use the move controls to arrange every item. Changes save together.'"
      :open="open"
      scrollable
      title="Arrange layout content"
      :ui="{
        content: 'admin-ui admin-ui-scope w-[calc(100vw-2rem)] max-w-6xl',
        body: 'space-y-5',
        footer: 'justify-between',
      }"
      @update:open="emit('update:open', $event)"
    >
      <template #body>
        <URadioGroup
          :items="contract.options"
          :model-value="selectedLayout"
          orientation="horizontal"
          :ui="{ fieldset: 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4' }"
          value-key="value"
          variant="card"
          @update:model-value="chooseLayout"
        >
          <template #label="{ item }">
            <span class="flex min-w-0 flex-col gap-1.5">
              <span aria-hidden="true" class="flex h-10 flex-col gap-1 rounded-sm border border-muted p-1">
                <span v-for="(row, rowIndex) in (item as ParagraphLayoutOption).iconMap" :key="rowIndex" class="flex min-h-0 flex-1 gap-1">
                  <span v-for="(region, index) in row" :key="`${region}-${index}`" class="min-w-0 flex-1 bg-accented" />
                </span>
              </span>
              <span class="truncate text-sm">{{ item.label }}</span>
            </span>
          </template>
        </URadioGroup>

        <div
          v-if="selectedOption"
          class="grid gap-4"
          :style="{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(14rem, 100%), 1fr))' }"
        >
          <section
            v-for="region in selectedOption.regions"
            :key="region.value"
            class="flex min-h-64 min-w-0 flex-col rounded-lg border border-muted bg-muted/20"
          >
            <h3 class="border-b border-muted px-3 py-2 text-sm font-semibold text-highlighted">
              {{ region.label }}
              <span class="font-normal text-muted">({{ childrenFor(region.value).length }})</span>
            </h3>
            <VueDraggable
              :animation="180"
              :aria-label="`${region.label} content`"
              class="flex min-h-48 flex-1 flex-col gap-2 p-2"
              ghost-class="opacity-50"
              :group="`layout-${contract.ownerRevisionId ?? 'draft'}`"
              handle=".layout-drag-handle"
              :model-value="childrenFor(region.value)"
              tag="ul"
              @update:model-value="children => updateRegion(region.value, children)"
            >
              <li
                v-for="(child, index) in childrenFor(region.value)"
                :key="child.uuid"
                class="rounded-md border border-muted bg-default p-2 shadow-sm"
              >
                <div class="flex items-center gap-2">
                  <UButton
                    :aria-label="`Drag ${child.label}`"
                    class="layout-drag-handle cursor-grab touch-none active:cursor-grabbing"
                    color="neutral"
                    icon="i-lucide-grip-vertical"
                    size="sm"
                    variant="ghost"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-highlighted">{{ child.label }}</p>
                    <p class="truncate text-xs text-muted">{{ child.bundle }} · #{{ child.paragraphId }}</p>
                  </div>
                  <UButton
                    :aria-label="`Move ${child.label} up`"
                    color="neutral"
                    :disabled="index === 0"
                    icon="i-lucide-arrow-up"
                    size="xs"
                    variant="ghost"
                    @click="moveWithin(child, -1)"
                  />
                  <UButton
                    :aria-label="`Move ${child.label} down`"
                    color="neutral"
                    :disabled="index === childrenFor(region.value).length - 1"
                    icon="i-lucide-arrow-down"
                    size="xs"
                    variant="ghost"
                    @click="moveWithin(child, 1)"
                  />
                </div>
                <USelect
                  v-if="selectedOption.regions.length > 1"
                  class="mt-2 w-full"
                  :items="selectedOption.regions"
                  label-key="label"
                  :model-value="region.value"
                  size="xs"
                  value-key="value"
                  @update:model-value="value => moveToRegion(child, value)"
                />
              </li>
            </VueDraggable>
          </section>
        </div>

        <p aria-live="polite" class="sr-only">{{ announcement }}</p>
        <UAlert v-if="error" color="error" :description="error" icon="i-lucide-circle-alert" />
      </template>

      <template #footer>
        <UButton color="neutral" label="Cancel" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          color="neutral"
          icon="i-lucide-save"
          label="Save arrangement"
          :loading="saving"
          variant="solid"
          @click="save"
        />
      </template>
    </UModal>
  </ClientOnly>
</template>
