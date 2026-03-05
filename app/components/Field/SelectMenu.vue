<script setup lang="ts">
import type { WebformFieldProps } from '../../../types'
import { transformOptions } from '~/utils/transformUtils'

const props = defineProps<{
  field: WebformFieldProps
  fieldName: string
  state: Record<string, string>
}>()

const { webform } = useAppConfig().stirTheme
const portal = useOverlayPortal()
const selectItems = computed(() => transformOptions(props.field['#options'] || {}))

onMounted(() => {
  if (props.state[props.fieldName] === undefined) {
    props.state[props.fieldName] = ''
  }
})
</script>

<template>
  <USelectMenu
    v-model="state[fieldName]"
    class="w-full"
    :items="selectItems"
    placeholder="Select"
    :portal="portal"
    :variant="webform.variant"
  />
</template>
