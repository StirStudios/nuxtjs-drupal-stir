<script setup lang="ts">
import type { EditAction, EditActionKey } from '~/types'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  link?: string
  layoutLink?: string
  showQuickEdit?: boolean
  quickEditDisabled?: boolean
  quickEditLabel?: string
  fullEditLabel?: string
  controlsPlacement?: 'sibling' | 'slot'
}>()

defineSlots<{
  default(props: {
    actions: EditAction[]
    hasActions: false
    selectAction: (key: EditActionKey) => void
  }): unknown
}>()

const actions: EditAction[] = []
const selectAction = (_key: EditActionKey) => {}
</script>

<template>
  <slot :actions="actions" :has-actions="false" :select-action="selectAction" />
</template>
