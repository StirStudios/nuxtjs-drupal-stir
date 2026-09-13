<script setup lang="ts">
import { resolveAlignClasses, type AlignConfig } from '#stir/utils/gridClasses'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  align?: AlignConfig
  iconName?: string
  iconSize?: number | string
  direction?: string

  editLink?: string
}>()

const alignClasses = computed(() => resolveAlignClasses(props.align))
</script>

<template>
  <ParagraphReveal :id="id" :direction="direction">
    <EditLink :id="id" :link="editLink" :parent-uuid="parentUuid">
      <WrapDiv :align="alignClasses">
        <UIcon
          v-if="iconName"
          :class="['text-primary inline-block', iconSize ? `size-${iconSize}` : undefined]"
          :name="iconName"
        />
      </WrapDiv>
    </EditLink>
  </ParagraphReveal>
</template>
