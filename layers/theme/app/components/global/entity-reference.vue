<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: string | number
  uuid?: string
  entityType?: string
  type?: string
  bundle?: string
  label?: string
  url?: string
}>()

defineSlots<{
  default?(props: {
    id?: string | number
    label: string
    entityType: string
    url?: string
  }): unknown
}>()

const normalizedEntityType = computed(() => props.entityType || props.type || '')
const referenceLabel = computed(() => {
  const label = props.label?.trim()
  const url = props.url?.trim()

  return label || url || [normalizedEntityType.value, props.id].filter(Boolean).join(' ')
})
</script>

<template>
  <ULink
    v-if="url"
    v-bind="$attrs"
    class="text-primary font-medium underline-offset-4 hover:underline"
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
  </ULink>
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
