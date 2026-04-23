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
  <WrapGrid :grid-items="gridItems">
    <EditLink :link="editLink" :parent-uuid="parentUuid">
      <slot name="media" />
    </EditLink>
  </WrapGrid>
</template>
