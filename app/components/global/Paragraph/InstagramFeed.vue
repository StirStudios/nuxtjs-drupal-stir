<script setup lang="ts">
defineProps<{
  id?: number
  uid?: number
  uuid?: string
  parentUuid?: string
  region?: string

  maxItems?: number
  gridItems?: string
  randomize?: boolean
  editLink?: string
}>()

defineSlots<{
  media?: () => VNode[] | VNode | null
}>()
</script>

<template>
  <EditLink :link="editLink" :parent-uuid="parentUuid">
    <WrapGrid :grid-items="gridItems">
      <slot name="media" />
    </WrapGrid>
  </EditLink>
</template>
