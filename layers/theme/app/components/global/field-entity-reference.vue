<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  id?: string | number
  targetId?: string | number
  uuid?: string
  entityType?: string
  type?: string
  bundle?: string
  label?: string
  url?: string
  entity?: {
    element?: string
    props?: Record<string, unknown>
    slots?: Record<string, unknown>
  }
}>()

function stringProp(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

const referenceProps = computed(() => {
  const entityProps = props.entity?.props || {}
  const defaultSlot = props.entity?.slots?.default

  return {
    id: props.id ?? props.targetId,
    uuid: props.uuid,
    entityType: props.entityType ?? stringProp(entityProps.entityType),
    type: props.type ?? stringProp(entityProps.type),
    bundle: props.bundle ?? stringProp(entityProps.bundle),
    label: props.label ?? (typeof defaultSlot === 'string' ? defaultSlot : undefined),
    url: props.url ?? stringProp(entityProps.url) ?? stringProp(entityProps.href),
  }
})
</script>

<template>
  <EntityReference v-bind="{ ...referenceProps, ...$attrs }">
    <template v-if="$slots.default" #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </EntityReference>
</template>
