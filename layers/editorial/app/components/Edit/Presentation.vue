<script setup lang="ts">
import type {
  EditAction,
  ParagraphPresentationField,
  ParagraphPresentationKey,
  ParagraphPresentationResponse,
} from '#stir/types'

const props = defineProps<{
  action: EditAction
}>()

const open = ref(false)
const loading = ref(false)
const pendingSaves = ref(0)
const error = ref('')
const fields = ref<ParagraphPresentationField[]>([])
let saveQueue = Promise.resolve()

const endpoint = computed(() =>
  `/api/paragraph/${props.action.paragraphId}/presentation`,
)
const saving = computed(() => pendingSaves.value > 0)
const status = computed(() => {
  if (saving.value) return 'Saving…'
  if (error.value) return error.value
  return fields.value.length ? 'Saved' : ''
})

async function load(): Promise<void> {
  if (loading.value || fields.value.length) return

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<ParagraphPresentationResponse>(endpoint.value)

    fields.value = response.fields
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

function updateValue(
  key: ParagraphPresentationKey,
  value: boolean | string | string[],
): void {
  const field = fields.value.find(candidate => candidate.key === key)

  if (!field || field.value === value) return

  field.value = value
  error.value = ''
  pendingSaves.value += 1

  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const response = await $fetch<ParagraphPresentationResponse>(endpoint.value, {
        method: 'POST',
        body: { values: { [key]: value } },
      })

      fields.value = response.fields
      await refreshNuxtData()
    })
    .catch((cause) => {
      error.value = cause instanceof Error
        ? cause.message
        : 'Unable to save quick settings.'
    })
    .finally(() => {
      pendingSaves.value -= 1
    })
}

function handleOpen(value: boolean): void {
  open.value = value
  if (value) void load()
}
</script>

<template>
  <UPopover
    :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
    :open="open"
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
      <div class="admin-ui admin-ui-scope w-80 max-w-[calc(100vw-2rem)] p-4">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold text-highlighted">
              Quick settings
            </h2>
            <p class="text-sm text-muted">
              Changes save automatically.
            </p>
          </div>
          <span
            aria-live="polite"
            class="text-xs"
            :class="error ? 'text-error' : 'text-muted'"
          >
            {{ status }}
          </span>
        </div>

        <div v-if="loading" aria-label="Loading quick settings" class="space-y-3">
          <USkeleton v-for="index in 4" :key="index" class="h-9 w-full" />
        </div>

        <div v-else-if="fields.length" class="space-y-4">
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
            <USelect
              v-else-if="field.type === 'select'"
              class="w-full"
              :items="field.options"
              label-key="label"
              :model-value="field.value as string"
              value-key="value"
              @update:model-value="value => updateValue(field.key, value)"
            />
            <USelectMenu
              v-else
              class="w-full"
              :items="field.options?.filter(option => option.value !== '')"
              label-key="label"
              :model-value="field.value as string[]"
              multiple
              value-key="value"
              @update:model-value="value => updateValue(field.key, value)"
            />
          </UFormField>
        </div>

        <p v-else-if="!error" class="text-sm text-muted">
          This section has no quick presentation settings.
        </p>

        <USeparator v-if="action.fullEditLink" class="my-4" />
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
  </UPopover>
</template>
