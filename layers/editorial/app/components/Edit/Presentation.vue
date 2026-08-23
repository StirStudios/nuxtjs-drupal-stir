<script setup lang="ts">
import type {
  EditAction,
  ParagraphPresentationField,
  ParagraphPresentationKey,
  ParagraphPresentationResponse,
} from '#stir/types'
import { pageRefreshKey } from '#stir/utils/pageRefresh'
import type { PageRefresh } from '#stir/utils/pageRefresh'

const props = defineProps<{
  action: EditAction
}>()

const refreshRenderedPage = inject<PageRefresh>(pageRefreshKey)
const open = ref(false)
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const fields = ref<ParagraphPresentationField[]>([])
const savedValues = ref<Record<ParagraphPresentationKey, boolean | string | string[]>>({} as Record<ParagraphPresentationKey, boolean | string | string[]>)
let savedTimer: ReturnType<typeof setTimeout> | undefined

const popoverUi = {
  content: 'admin-ui admin-ui-scope admin-ui-popover',
}
const selectUi = {
  base: 'admin-ui-popover-control',
  content: 'admin-ui admin-ui-scope admin-ui-popover',
}

const endpoint = computed(() =>
  `/api/paragraph/${props.action.paragraphId}/presentation`,
)
const changedValues = computed(() => Object.fromEntries(
  fields.value
    .filter(field => JSON.stringify(field.value) !== JSON.stringify(savedValues.value[field.key]))
    .map(field => [field.key, field.value]),
))
const dirty = computed(() => Object.keys(changedValues.value).length > 0)
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
  }
  catch (cause) {
    error.value = cause instanceof Error
      ? cause.message
      : 'Unable to load quick settings.'
  }
  finally {
    loading.value = false
  }
}

function cloneValue(value: boolean | string | string[]): boolean | string | string[] {
  return Array.isArray(value) ? [...value] : value
}

function selectableOptions(field: ParagraphPresentationField) {
  return field.options?.filter(option => option.value !== '') ?? []
}

function updateSelectValue(field: ParagraphPresentationField, value?: string | null): void {
  updateValue(field.key, value ?? '')
}

function updateMultiselectValue(field: ParagraphPresentationField, value?: string[] | null): void {
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
  savedValues.value = Object.fromEntries(
    response.fields.map(field => [field.key, cloneValue(field.value)]),
  ) as Record<ParagraphPresentationKey, boolean | string | string[]>
}

function updateValue(
  key: ParagraphPresentationKey,
  value: boolean | string | string[],
): void {
  const field = fields.value.find(candidate => candidate.key === key)

  if (!field || field.value === value) return

  field.value = value
  saved.value = false
  error.value = ''
  if (savedTimer) clearTimeout(savedTimer)
}

async function save(): Promise<void> {
  if (saving.value || !dirty.value) return

  saving.value = true
  saved.value = false
  error.value = ''

  try {
    const response = await $fetch<ParagraphPresentationResponse>(endpoint.value, {
      method: 'POST',
      body: { values: changedValues.value },
    })

    acceptResponse(response)
    await refreshPageAfterSave()
    saved.value = true
    if (savedTimer) clearTimeout(savedTimer)
    savedTimer = setTimeout(() => {
      saved.value = false
    }, 3000)
  }
  catch (cause) {
    error.value = cause instanceof Error
      ? cause.message
      : 'Unable to save quick settings.'
  }
  finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  if (savedTimer) clearTimeout(savedTimer)
})

function handleOpen(value: boolean): void {
  if (!value && dirty.value) {
    fields.value.forEach((field) => {
      field.value = cloneValue(savedValues.value[field.key])
    })
  }

  open.value = value
  if (value) void load()
}
</script>

<template>
  <UPopover
    :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
    :open="open"
    :ui="popoverUi"
    @update:open="handleOpen"
  >
    <UButton
      :aria-label="action.ariaLabel"
      color="neutral"
      :icon="action.icon"
      :title="action.tooltip"
      :ui="{ base: action.buttonClass }"
      :variant="action.variant"
      @click.stop
    >
      <span class="sr-only">{{ action.ariaLabel }}</span>
    </UButton>

    <template #content>
      <UCard
        class="w-96 max-w-[calc(100vw-2rem)]"
        :ui="{ header: '!p-4', body: '!p-4', footer: '!p-4' }"
      >
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold text-highlighted">
                Quick settings
              </h2>
              <p class="text-sm text-muted">
                Adjust settings, then save once.
              </p>
            </div>
            <span
              v-if="status"
              aria-live="polite"
              class="flex items-center gap-1 text-xs font-medium"
              :class="error ? 'text-error' : 'text-muted'"
            >
              <UIcon
                :class="saving ? 'animate-spin' : ''"
                :name="statusIcon"
              />
              {{ status }}
            </span>
          </div>
        </template>

        <div v-if="loading" aria-label="Loading quick settings" class="space-y-3">
          <USkeleton v-for="index in 4" :key="index" class="h-9 w-full" />
        </div>

        <div v-else-if="fields.length" class="grid grid-cols-2 gap-x-3 gap-y-4">
          <UFormField
            v-for="field in fields"
            :key="field.key"
            :label="field.label"
          >
            <USwitch
              v-if="field.type === 'boolean'"
              :model-value="field.value as boolean"
              @update:model-value="value => updateValue(field.key, value)"
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
              :ui="selectUi"
              value-key="value"
              @update:model-value="value => updateSelectValue(field, value)"
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
              :ui="selectUi"
              value-key="value"
              @update:model-value="value => updateMultiselectValue(field, value)"
            />
          </UFormField>
        </div>

        <p v-else-if="!error" class="text-sm text-muted">
          This section has no quick presentation settings.
        </p>

        <template #footer>
          <div
            class="grid gap-2"
            :class="fields.length && action.fullEditLink ? 'grid-cols-2' : 'grid-cols-1'"
          >
            <UButton
              v-if="fields.length"
              block
              color="neutral"
              :disabled="!dirty"
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
              :to="action.fullEditLink"
              variant="soft"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UPopover>
</template>
