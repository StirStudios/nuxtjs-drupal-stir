<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id: string | number
  uuid?: string
  entityType?: string
  type?: string
  bundle?: string
  label?: string
  url?: string
}>()

defineSlots<{
  default?(props: {
    id: string | number
    label: string
    entityType: string
    url?: string
  }): unknown
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
    v-bind="$attrs"
    :to="url"
  >
    <slot
      :id="id"
      :entity-type="normalizedEntityType"
      :label="referenceLabel"
      :url="url"
    >
      {{ referenceLabel }}
    </slot>
  </NuxtLink>
  <span v-else v-bind="$attrs">
    <slot
      :id="id"
      :entity-type="normalizedEntityType"
      :label="referenceLabel"
    >
      {{ referenceLabel }}
    </slot>
  </span>
</template>
