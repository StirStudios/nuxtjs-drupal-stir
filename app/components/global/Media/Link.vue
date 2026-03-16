<script setup lang="ts">
const props = defineProps<{
  type: 'link'
  href: string
  title?: string
  target?: string
}>()

const linkTarget = computed(() => props.target || '_blank')
const linkRel = computed(() =>
  linkTarget.value === '_blank' ? 'noopener noreferrer' : undefined,
)
</script>

<template>
  <UButton
    color="primary"
    external
    :label="props.title || 'Listen'"
    :rel="linkRel"
    :target="linkTarget"
    :to="props.href"
    variant="solid"
  />
</template>
