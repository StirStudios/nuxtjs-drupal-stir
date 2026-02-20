<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'
import { useEventBus } from '@vueuse/core'
import { transformOptions } from '~/utils/transformUtils'

const props = defineProps<{
  field?: WebformFieldProps
  fieldName: string
  state: Record<string, string>
  items?: Record<string, string> | Array<{ label: string; value: string }>
  placeholder?: string
}>()

const { webform } = useAppConfig().stirTheme

const getDefaultValue = () => {
  const value = props.field?.['#defaultValue']

  return typeof value === 'string' ? value : ''
}

const tabBus = useEventBus<string>('tab-changed')

onMounted(() => {
  props.state[props.fieldName] ??= getDefaultValue()
})

watch(
  () => props.state[props.fieldName],
  (newVal) => {
    if (!newVal) {
      props.state[props.fieldName] = getDefaultValue()
    }
  },
  { immediate: true },
)

const selectItems = computed(() => {
  if (Array.isArray(props.items)) return props.items
  if (props.items && typeof props.items === 'object') {
    return transformOptions(props.items)
  }
  return props.field ? transformOptions(props.field['#options'] ?? {}) : []
})

const renderAsButtons = computed(() => props.fieldName === 'tabs')

const handleButtonClick = (value: string) => {
  props.state[props.fieldName] = value
  tabBus.emit(value)
}
</script>

<template>
  <template v-if="renderAsButtons">
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="item in selectItems"
        :key="item.value"
        :active="state[fieldName] === item.value"
        active-color="primary"
        active-variant="solid"
        :label="item.label"
        :variant="webform.variant"
        @click="handleButtonClick(item.value)"
      />
    </div>
  </template>
  <USelect
    v-else
    v-model="state[fieldName]"
    class="w-full"
    :items="selectItems"
    :placeholder="placeholder || 'Select'"
    :variant="webform.variant"
  />
</template>
