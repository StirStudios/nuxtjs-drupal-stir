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
      return 'text-success'
    case 'warning':
      return 'text-warning'
    case 'error':
      return 'text-error'
    default:
      return 'text-muted'
  }
})
</script>

<template>
  <div
    :aria-busy="loading"
    aria-live="polite"
    class="space-y-4 py-2 text-center"
  >
    <div class="flex justify-center">
      <UIcon
        v-if="icon"
        class="size-12"
        :class="[toneClasses, { 'animate-spin': loading }]"
        :name="icon"
      />
    </div>
    <div class="space-y-2">
      <h1 class="text-highlighted mb-0! text-xl! font-semibold!">
        {{ title }}
      </h1>
      <p class="text-muted mx-auto max-w-sm text-sm leading-6">
        {{ description }}
      </p>
    </div>
  </div>
</template>
