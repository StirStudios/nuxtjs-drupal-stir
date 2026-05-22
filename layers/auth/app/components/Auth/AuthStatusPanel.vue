<script setup lang="ts">
const props = withDefaults(defineProps<{
  tone?: 'neutral' | 'success' | 'warning' | 'error'
  title: string
  description: string
  icon?: string
  loading?: boolean
}>(), {
  tone: 'neutral',
  icon: undefined,
  loading: false,
})

const toneClasses = computed(() => {
  switch (props.tone) {
    case 'success':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'warning':
      return 'text-amber-700 dark:text-amber-300'
    case 'error':
      return 'text-red-700 dark:text-red-300'
    default:
      return 'text-muted'
  }
})
</script>

<template>
  <div class="space-y-4 py-2 text-center">
    <div class="flex justify-center">
      <UIcon
        v-if="icon"
        class="size-12"
        :class="[toneClasses, { 'animate-spin': loading }]"
        :name="icon"
      />
    </div>
    <div class="space-y-2">
      <h1 class="text-highlighted text-xl font-semibold">
        {{ title }}
      </h1>
      <p class="text-muted mx-auto max-w-sm text-sm leading-6">
        {{ description }}
      </p>
    </div>
  </div>
</template>
