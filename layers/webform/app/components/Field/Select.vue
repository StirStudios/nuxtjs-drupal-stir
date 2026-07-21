<script setup lang="ts">
import type { WebformFieldProps } from '#stir/types'
import { useEventBus } from '@vueuse/core'
import { transformOptions } from '#stir-webform/utils/transformUtils'
import {
  resolveUiButtonVariant,
  resolveUiFieldVariant,
} from '#stir/utils/nuxtUiProps'

const props = defineProps<{
  field?: WebformFieldProps
  fieldName: string
  state: Record<string, string>
  items?: Record<string, string> | Array<{ label: string; value: string }>
  placeholder?: string
  floatingLabel?: boolean
}>()

const webform = useStirWebformTheme()
const portal = useOverlayPortal()
const buttonVariant = computed(() => resolveUiButtonVariant(webform.fieldVariant, 'outline'))
const fieldVariant = computed(() => resolveUiFieldVariant(webform.fieldVariant))

const tabBus = useEventBus<string>('tab-changed')

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
        :variant="buttonVariant"
        @click="handleButtonClick(item.value)"
      />
    </div>
  </template>
  <USelect
    v-else
    v-model="state[fieldName]"
    :class="['w-full', webform.fieldText]"
    :items="selectItems"
    :placeholder="placeholder || 'Select'"
    :portal="portal"
    :variant="fieldVariant"
  />
</template>
