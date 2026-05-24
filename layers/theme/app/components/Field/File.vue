<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '~/types'
import { inputIdInjectionKey } from '@nuxt/ui/composables'
import {
  allowsMultipleFiles,
  getFileAccept,
  getFileMaxSize,
  isFileValue,
} from '~/utils/webformFileUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

const { webform } = useAppConfig().stirTheme
const injectedInputId = inject(inputIdInjectionKey, undefined)
const fallbackId = useId()
const input = ref<HTMLInputElement | null>(null)
const id = computed(() => injectedInputId?.value ?? fallbackId)
const accept = computed(() => getFileAccept(props.field))
const isMultiple = computed(() => allowsMultipleFiles(props.field))
const maxSize = computed(() => getFileMaxSize(props.field))
const selectedFiles = computed(() => {
  const value = props.state[props.fieldName]

  if (Array.isArray(value)) return value.filter(isFileValue)
  return isFileValue(value) ? [value] : []
})
const fileSummary = computed(() => {
  if (selectedFiles.value.length === 0) return 'No file selected'
  if (selectedFiles.value.length === 1) return selectedFiles.value[0]?.name

  return `${selectedFiles.value.length} files selected`
})
const helperText = computed(() => {
  if (!maxSize.value) return ''

  const megabytes = maxSize.value / 1024 / 1024

  return `Maximum file size: ${megabytes >= 1 ? `${megabytes.toFixed(1)} MB` : `${Math.round(maxSize.value / 1024)} KB`}`
})

function handleChange(event: Event): void {
  const files = Array.from(
    (event.target as HTMLInputElement | null)?.files ?? [],
  )

  props.state[props.fieldName] = isMultiple.value ? files : files[0]
}

function clearFiles(): void {
  props.state[props.fieldName] = isMultiple.value ? [] : undefined
  if (input.value) input.value.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <input
      :id="id"
      ref="input"
      :accept="accept"
      :aria-describedby="helperText ? `${id}-help` : undefined"
      :class="[
        webform.fieldInput,
        'block w-full cursor-pointer rounded-md border border-default bg-default text-sm text-highlighted file:me-4 file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-inverted hover:file:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60',
      ]"
      :multiple="isMultiple"
      :name="fieldName"
      :required="!!field['#required']"
      type="file"
      @change="handleChange"
    />

    <div class="flex items-center justify-between gap-3 text-sm text-muted">
      <span>{{ fileSummary }}</span>
      <UButton
        v-if="selectedFiles.length"
        color="neutral"
        label="Remove"
        size="xs"
        variant="ghost"
        @click="clearFiles"
      />
    </div>

    <p v-if="helperText" :id="`${id}-help`" class="text-xs text-muted">
      {{ helperText }}
    </p>
  </div>
</template>
