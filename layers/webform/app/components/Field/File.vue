<script setup lang="ts">
import type { WebformFieldProps, WebformState } from '#stir/types'
import {
  allowsMultipleFiles,
  getFileAccept,
  getFileMaxSize,
  isFileValue,
} from '#stir/utils/webformFileUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: WebformState
}>()

const accept = computed(() => getFileAccept(props.field))
const isMultiple = computed(() => allowsMultipleFiles(props.field))
const maxSize = computed(() => getFileMaxSize(props.field))
const helperText = computed(() => {
  if (!maxSize.value) return ''

  const megabytes = maxSize.value / 1024 / 1024

  return `Maximum file size: ${megabytes >= 1 ? `${megabytes.toFixed(1)} MB` : `${Math.round(maxSize.value / 1024)} KB`}`
})
const uploadLabel = computed(() =>
  isMultiple.value ? 'Drop files here' : 'Drop file here',
)
const modelValue = computed<File | File[] | null>({
  get() {
    const value = props.state[props.fieldName]

    if (isMultiple.value) {
      if (Array.isArray(value)) return value.filter(isFileValue)
      return isFileValue(value) ? [value] : []
    }

    return isFileValue(value) ? value : null
  },
  set(value) {
    if (isMultiple.value) {
      props.state[props.fieldName] = Array.isArray(value)
        ? value.filter(isFileValue)
        : isFileValue(value)
          ? [value]
          : []

      return
    }

    props.state[props.fieldName] = isFileValue(value) ? value : undefined
  },
})
</script>

<template>
  <UFileUpload
    v-model="modelValue"
    :accept="accept"
    :description="helperText"
    :label="uploadLabel"
    layout="list"
    :multiple="isMultiple"
    :name="fieldName"
    :required="!!field['#required']"
  />
</template>
