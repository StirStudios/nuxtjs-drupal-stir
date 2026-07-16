<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  date?: string
  header?: string
  headerTag?: string
  icon?: string
  text?: string

  editLink?: string
}>()
</script>

<template>
  <!-- Data-only child consumed from the Timeline slot by ParagraphTimeline. -->
  <span aria-hidden="true" class="hidden" />
</template>
