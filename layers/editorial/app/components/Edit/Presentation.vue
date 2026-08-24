<script setup lang="ts">
import type {
  EditAction,
  ParagraphLayoutContract,
  ParagraphLayoutOption,
  ParagraphPresentationField,
  ParagraphPresentationKey,
  ParagraphPresentationResponse,
} from '#stir/types'
import { pageRefreshKey } from '#stir/utils/pageRefresh'
import type { PageRefresh } from '#stir/utils/pageRefresh'
import {
  areParagraphLayoutMappingsValid,
  createParagraphLayoutMappings,
} from '#stir/utils/paragraphLayoutTransition'
import { adminUiTheme } from '../../utils/adminUiTheme'

const props = defineProps<{
  action: EditAction
}>()

const refreshRenderedPage = inject<PageRefresh>(pageRefreshKey)
const toast = useToast()
const open = ref(false)
const tooltipOpen = ref(false)
const quickSettingsHeading = ref<HTMLElement | null>(null)
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const fields = ref<ParagraphPresentationField[]>([])
const layout = ref<ParagraphLayoutContract | null>(null)
const selectedLayout = ref('')
const layoutMappings = ref<Record<string, string>>({})
const arrangementOpen = ref(false)
const savedValues = ref<
  Record<ParagraphPresentationKey, boolean | string | string[]>
>({} as Record<ParagraphPresentationKey, boolean | string | string[]>)
let savedTimer: ReturnType<typeof setTimeout> | undefined

const popoverContent = {
  align: 'end' as const,
  side: 'bottom' as const,
  sideOffset: 8,
  onOpenAutoFocus: handleOpenAutoFocus,
}

const endpoint = computed(
  () => `/api/paragraph/${props.action.paragraphId}/presentation`,
)
const changedValues = computed(() =>
  Object.fromEntries(
    fields.value
      .filter(
        (field) =>
          JSON.stringify(field.value) !==
          JSON.stringify(savedValues.value[field.key]),
      )
      .map((field) => [field.key, field.value]),
  ),
)
const selectedLayoutOption = computed(
  () =>
    layout.value?.options.find(
      (option) => option.value === selectedLayout.value,
    ) ?? null,
)
const layoutSummary = computed(
  () => selectedLayoutOption.value?.label ?? 'Choose layout',
)
const layoutDirty = computed(() =>
  Boolean(layout.value && selectedLayout.value !== layout.value.current),
)
const layoutValid = computed(
  () =>
    !layoutDirty.value ||
    areParagraphLayoutMappingsValid(
      selectedLayoutOption.value,
      layoutMappings.value,
    ),
)
const dirty = computed(
  () => Object.keys(changedValues.value).length > 0 || layoutDirty.value,
)
const status = computed(() => {
  if (saving.value) return 'Saving…'
  if (error.value) return error.value
  return saved.value ? 'Saved' : ''
})
const statusIcon = computed(() => {
  if (saving.value) return 'i-lucide-loader-circle'
  if (error.value) return 'i-lucide-circle-alert'
  return saved.value ? 'i-lucide-circle-check' : ''
})

async function load(): Promise<void> {
  if (loading.value || fields.value.length) return

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<ParagraphPresentationResponse>(endpoint.value)

    acceptResponse(response)
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Unable to load quick settings.'
  } finally {
    loading.value = false
  }
}

function cloneValue(
  value: boolean | string | string[],
): boolean | string | string[] {
  return Array.isArray(value) ? [...value] : value
}

function selectableOptions(field: ParagraphPresentationField) {
  return field.options?.filter((option) => option.value !== '') ?? []
}

function updateSelectValue(
  field: ParagraphPresentationField,
  value?: string | null,
): void {
  updateValue(field.key, value ?? '')
}

function updateMultiselectValue(
  field: ParagraphPresentationField,
  value?: string[] | null,
): void {
  updateValue(field.key, value ?? [])
}

async function refreshPageAfterSave(): Promise<void> {
  if (!refreshRenderedPage) {
    throw new Error('Unable to refresh the rendered page.')
  }

  await refreshRenderedPage()
}

function acceptResponse(response: ParagraphPresentationResponse): void {
  fields.value = response.fields
  layout.value = response.layout
  selectedLayout.value = response.layout?.current ?? ''
  resetLayoutMappings()
  savedValues.value = Object.fromEntries(
    response.fields.map((field) => [field.key, cloneValue(field.value)]),
  ) as Record<ParagraphPresentationKey, boolean | string | string[]>
}

function resetLayoutMappings(): void {
  layoutMappings.value = createParagraphLayoutMappings(
    selectedLayoutOption.value,
  )
}

function updateLayout(value: string): void {
  selectedLayout.value = value
  resetLayoutMappings()
  saved.value = false
  error.value = ''
}

function layoutUpdate() {
  if (!layout.value || !layoutDirty.value) return undefined

  return {
    target: selectedLayout.value,
    mappings: layoutMappings.value,
    expectedOwnerRevisionId: layout.value.ownerRevisionId,
  }
}

function updateValue(
  key: ParagraphPresentationKey,
  value: boolean | string | string[],
): void {
  const field = fields.value.find((candidate) => candidate.key === key)

  if (!field || field.value === value) return

  field.value = value
  saved.value = false
  error.value = ''
  if (savedTimer) clearTimeout(savedTimer)
}

async function save(): Promise<void> {
  if (saving.value || !dirty.value || !layoutValid.value) return

  saving.value = true
  saved.value = false
  error.value = ''

  try {
    const pendingLayout = layoutUpdate()
    const response = await $fetch<ParagraphPresentationResponse>(
      endpoint.value,
      {
        method: 'POST',
        body: {
          values: changedValues.value,
          ...(pendingLayout ? { layout: pendingLayout } : {}),
        },
      },
    )

    acceptResponse(response)
    await refreshPageAfterSave()
    toast.add({
      title: 'Quick settings saved',
      color: 'success',
      icon: 'i-lucide-circle-check',
    })
    saved.value = true
    if (savedTimer) clearTimeout(savedTimer)
    savedTimer = setTimeout(() => {
      saved.value = false
    }, 3000)
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Unable to save quick settings.'
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  if (savedTimer) clearTimeout(savedTimer)
})

function handleOpen(value: boolean): void {
  if (!value && dirty.value) {
    fields.value.forEach((field) => {
      const savedValue = savedValues.value[field.key]

      if (savedValue !== undefined) field.value = cloneValue(savedValue)
    })
    selectedLayout.value = layout.value?.current ?? ''
    resetLayoutMappings()
  }

  open.value = value
  if (value) tooltipOpen.value = false
  if (value) void load()
}

function handleOpenAutoFocus(event: Event): void {
  event.preventDefault()
  void nextTick(() => quickSettingsHeading.value?.focus())
}

function openArrangement(): void {
  handleOpen(false)
  arrangementOpen.value = true
}

function openFullEditor(): void {
  if (!props.action.fullEditLink || !import.meta.client) return

  window.location.assign(props.action.fullEditLink)
}

async function handleArrangementSaved(
  response: ParagraphPresentationResponse,
): Promise<void> {
  acceptResponse(response)
  await refreshPageAfterSave()
}
</script>

<template>
  <UPopover :content="popoverContent" :open="open" @update:open="handleOpen">
    <UTooltip
      :open="tooltipOpen"
      :text="action.tooltip"
      @update:open="(value) => (tooltipOpen = value)"
    >
      <UButton
        :aria-label="action.ariaLabel"
        color="neutral"
        :icon="action.icon"
        :ui="{ base: action.buttonClass }"
        :variant="action.variant"
        @click.stop="tooltipOpen = false"
      >
        <span class="sr-only">{{ action.ariaLabel }}</span>
      </UButton>
    </UTooltip>

    <template #content>
      <UCard class="w-96 max-w-[calc(100vw-2rem)]">
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2
                ref="quickSettingsHeading"
                class="admin-ui-card-title text-highlighted outline-none"
                tabindex="-1"
              >
                Quick settings
              </h2>
            </div>
            <span
              v-if="status"
              aria-live="polite"
              class="flex items-center gap-1 text-xs font-medium"
              :class="error ? 'text-error' : 'text-muted'"
            >
              <UIcon
                :class="saving ? 'admin-ui-spinner' : ''"
                :name="statusIcon"
              />
              {{ status }}
            </span>
          </div>
        </template>

        <div
          v-if="loading"
          aria-label="Loading quick settings"
          class="space-y-3"
        >
          <USkeleton v-for="index in 4" :key="index" class="h-9 w-full" />
        </div>

        <div v-else-if="fields.length || layout" class="space-y-3">
          <UCollapsible
            v-if="layout"
            class="border-muted rounded-md border"
            :ui="{ content: 'border-t border-muted' }"
          >
            <template #default="{ open: layoutOpen }">
              <UButton
                block
                color="neutral"
                :icon="
                  layoutDirty
                    ? 'i-lucide-layout-dashboard'
                    : 'i-lucide-layout-template'
                "
                :label="`Layout · ${layoutSummary}`"
                :trailing-icon="
                  layoutOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
                "
                :ui="{ base: 'justify-between rounded-md px-3 py-2' }"
                variant="ghost"
              />
            </template>

            <template #content>
              <div class="space-y-3 p-3">
                <URadioGroup
                  :items="layout.options"
                  :model-value="selectedLayout"
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
                  @update:model-value="updateLayout"
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
                  v-if="layoutDirty && selectedLayoutOption?.moves.length"
                  color="warning"
                  icon="i-lucide-move-right"
                  title="Content movement"
                  variant="subtle"
                >
                  <template #description>
                    <div class="mt-2 grid gap-3">
                      <UFormField
                        v-for="move in selectedLayoutOption.moves"
                        :key="move.source"
                        :label="`${move.sourceLabel} (${move.count})`"
                      >
                        <USelect
                          v-model="layoutMappings[move.source]"
                          class="w-full"
                          :items="selectedLayoutOption.regions"
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
                  @click="openArrangement"
                />
              </div>
            </template>
          </UCollapsible>

          <div
            v-if="fields.length"
            class="grid grid-cols-2 gap-x-3 gap-y-4"
          >
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
                  @update:model-value="(value) => updateValue(field.key, value)"
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
                  @update:model-value="
                    (value) => updateSelectValue(field, value)
                  "
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
                  @update:model-value="
                    (value) => updateMultiselectValue(field, value)
                  "
                />
              </UFormField>
            </template>
          </div>
        </div>

        <p v-else-if="!error" class="text-muted text-sm">
          This section has no quick presentation settings.
        </p>

        <template #footer>
          <div
            class="grid gap-2"
            :class="
              (fields.length || layout) && action.fullEditLink
                ? 'grid-cols-2'
                : 'grid-cols-1'
            "
          >
            <UButton
              v-if="fields.length || layout"
              block
              color="neutral"
              :disabled="!dirty || !layoutValid"
              icon="i-lucide-save"
              label="Save changes"
              :loading="saving"
              variant="solid"
              @click="save"
            />
            <UButton
              v-if="action.fullEditLink"
              block
              color="neutral"
              icon="i-lucide-square-pen"
              label="Open full editor"
              variant="soft"
              @click="openFullEditor"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UPopover>

  <EditLayoutArrangement
    v-if="layout?.children"
    v-model:open="arrangementOpen"
    :contract="layout"
    :endpoint="endpoint"
    @saved="handleArrangementSaved"
  />
</template>
