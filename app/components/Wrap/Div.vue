<script setup lang="ts">
const props = defineProps<{
  styles?: string | string[]
  align?: string
}>()

const normalized = computed(() => {
  if (!props.styles) return null
  if (Array.isArray(props.styles) && props.styles.every((s) => !s || !s.trim()))
    return null
  if (typeof props.styles === 'string' && props.styles.trim() === '')
    return null
  return props.styles
})
</script>

<template>
  <WrapAlign :align="align">
    <div v-if="normalized" :class="normalized">
      <slot />
    </div>
    <slot v-else />
  </WrapAlign>
</template>
