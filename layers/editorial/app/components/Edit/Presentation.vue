<script setup lang="ts">
import type {
  EditAction,
  ParagraphLayoutContract,
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
                class="admin-ui-card-title text-highlighted outline-hidden"
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
          <EditPresentationLayout
            v-if="layout"
            v-model:mappings="layoutMappings"
            :dirty="layoutDirty"
            :layout="layout"
            :option="selectedLayoutOption"
            :selected="selectedLayout"
            @arrange="openArrangement"
            @select="updateLayout"
          />

          <EditPresentationFields
            v-if="fields.length"
            :fields="fields"
            @update="updateValue"
          />
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
