<script setup lang="ts">
defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  align?: string
  iconName?: string
  iconSize?: number | string
  direction?: string

  editLink?: string
}>()
</script>

<template>
  <ParagraphReveal :id="id" :direction="direction">
    <EditLink :link="editLink" :parent-uuid="parentUuid">
      <WrapDiv :align="align">
        <UIcon
          v-if="iconName"
          :class="['text-primary inline-block', iconSize ? `size-${iconSize}` : undefined]"
          :name="iconName"
        />
      </WrapDiv>
    </EditLink>
  </ParagraphReveal>
</template>
