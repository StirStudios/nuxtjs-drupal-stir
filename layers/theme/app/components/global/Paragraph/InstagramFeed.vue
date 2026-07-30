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
  direction?: string
  editLink?: string
}>()

defineSlots<{
  media?: () => VNode[] | VNode | null
}>()
</script>

<template>
  <ParagraphReveal :id="id" :direction="direction">
    <WrapGrid :grid-items="gridItems">
      <EditLink :link="editLink" :parent-uuid="parentUuid">
        <slot name="media" />
      </EditLink>
    </WrapGrid>
  </ParagraphReveal>
</template>
