<script setup lang="ts">
const props = defineProps<{
  layout: {
    card?: boolean
    gradient?: string
    compact?: boolean
  }
}>()

const { gradients, card } = useAppConfig().stirTheme
const gradientMap = gradients as Record<string, string>
const gradientClass = computed(() => {
  if (!props.layout.card) return ''

  const key = props.layout.gradient ?? card.defaultGradient ?? '1'

  return gradientMap[key] || ''
})

const effectClass = computed(() => card.effect ?? '')
const sizeClass = computed(() =>
  props.layout.compact ? (card.sizes?.compact ?? '') : (card.sizes?.default ?? ''),
)
</script>

<template>
  <div
    v-if="props.layout.card"
    aria-hidden="true"
    class="pointer-events-none"
    :class="[effectClass, sizeClass]"
  >
    <div
      class="h-full w-full"
      :class="gradientClass"
      style="
        clip-path: polygon(
          70% 30%,
          90% 45%,
          100% 40%,
          85% 60%,
          75% 70%,
          55% 65%,
          50% 80%,
          35% 90%,
          20% 75%,
          10% 55%,
          5% 35%,
          20% 10%,
          40% 15%,
          55% 25%,
          70% 30%
        );
      "
    />
  </div>
</template>
