<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    datetime: string
    dateOnly?: boolean
    locale?: string
    timeZone?: string
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
  }>(),
  {
    dateOnly: false,
    locale: undefined,
    timeZone: undefined,
    dateStyle: 'medium',
    timeStyle: undefined,
  },
)

const resolvedTimeZone = computed(() =>
  props.dateOnly ? 'UTC' : props.timeZone,
)
const resolvedTimeStyle = computed(() => {
  if (props.dateOnly) return undefined

  return props.timeStyle ?? 'short'
})
</script>

<template>
  <slot>
    <NuxtTime
      :date-style="dateStyle"
      :datetime="datetime"
      :locale="locale"
      :time-style="resolvedTimeStyle"
      :time-zone="resolvedTimeZone"
    />
  </slot>
</template>
