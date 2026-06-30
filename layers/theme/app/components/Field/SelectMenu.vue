<script setup lang="ts">
import type { WebformFieldProps } from '~/types'
import { transformOptions } from '~/utils/transformUtils'
import { resolveUiFieldVariant } from '~/utils/nuxtUiProps'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string>
}>()

const { webform } = useAppConfig().stirTheme
const portal = useOverlayPortal()
const fieldVariant = computed(() => resolveUiFieldVariant(webform.fieldVariant))
const selectItems = computed(() => transformOptions(props.field['#options'] || {}) as Array<Record<string, unknown>>)
const handleSelectUpdate = (value: unknown) => {
  props.state[props.fieldName] = String(
    (value as { value?: string })?.value ?? value ?? '',
  )
}

onMounted(() => {
  if (props.state[props.fieldName] === undefined) {
    props.state[props.fieldName] = ''
  }
})
</script>

<template>
  <USelectMenu
    class="w-full"
    :items="selectItems"
    :model-value="state[fieldName] as never"
    placeholder="Select"
    :portal="portal"
    :variant="fieldVariant"
    @update:model-value="handleSelectUpdate"
  />
</template>
