<script setup lang="ts">
import type { GridConfig } from '#stir/utils/gridClasses'

defineProps<{
  id?: number
  uid?: number
  uuid?: string
  parentUuid?: string
  region?: string

  maxItems?: number
  gridItems?: GridConfig
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
      <EditLink :id="id" :link="editLink" :parent-uuid="parentUuid">
        <slot name="media" />
      </EditLink>
    </WrapGrid>
  </ParagraphReveal>
</template>
