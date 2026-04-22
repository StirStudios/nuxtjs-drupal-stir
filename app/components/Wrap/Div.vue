<script setup lang="ts">
const props = defineProps<{
  styles?: string | string[]
  align?: string
}>()

const normalizedStyles = computed(() => {
  if (!props.styles) return null
  if (Array.isArray(props.styles)) {
    const filtered = props.styles
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)

    return filtered.length > 0 ? filtered : null
  }
  if (typeof props.styles !== 'string') return null
  if (props.styles.trim() === '')
    return null

  return props.styles.trim()
})

const normalizedAlign = computed(() => {
  if (typeof props.align !== 'string' || !props.align) return null
  const trimmed = props.align.trim()

  return trimmed ? trimmed : null
})

const wrapperClasses = computed(() => {
  const classes: string[] = []

  if (normalizedAlign.value) {
    classes.push('w-full', normalizedAlign.value)
  }

  if (normalizedStyles.value) {
    if (Array.isArray(normalizedStyles.value)) {
      classes.push(...normalizedStyles.value)
    } else {
      classes.push(normalizedStyles.value)
    }
  }

  return classes
})
</script>

<template>
  <div v-if="wrapperClasses.length > 0" :class="wrapperClasses">
    <slot />
  </div>
  <slot v-else />
</template>
