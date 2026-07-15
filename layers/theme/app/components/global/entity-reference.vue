<script setup lang="ts">
const props = defineProps<{
  id: string | number
  uuid?: string
  entityType?: string
  type?: string
  bundle?: string
  label?: string
  url?: string
}>()

const normalizedEntityType = computed(() => props.entityType || props.type || '')
const referenceLabel = computed(() => {
  const label = props.label?.trim()

  return label || [normalizedEntityType.value, props.id].filter(Boolean).join(' ')
})
</script>

<template>
  <NuxtLink
    v-if="url"
    :to="url"
  >
    {{ referenceLabel }}
  </NuxtLink>
  <span v-else>{{ referenceLabel }}</span>
</template>
