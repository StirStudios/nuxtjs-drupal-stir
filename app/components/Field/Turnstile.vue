<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'

type TurnstileTheme = {
  appearance?: 'always' | 'execute' | 'interaction-only'
  label?: string
}

const turnstileToken = defineModel<string>()
const themeTurnstile = ((useAppConfig().stirTheme as { turnstile?: unknown })
  .turnstile ?? {}) as TurnstileTheme
const hasLabel = computed(() => Boolean(themeTurnstile.label))
const container = ref<HTMLElement | null>(null)
const shouldRenderTurnstile = ref(false)
let stopObserver: (() => void) | null = null

const revealTurnstile = () => {
  if (shouldRenderTurnstile.value) return
  shouldRenderTurnstile.value = true
  stopObserver?.()
  stopObserver = null
}

onMounted(() => {
  if (!import.meta.client || shouldRenderTurnstile.value) return
  if (!container.value) {
    revealTurnstile()
    return
  }

  if (!('IntersectionObserver' in window)) {
    revealTurnstile()
    return
  }

  const { stop } = useIntersectionObserver(
    container,
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) revealTurnstile()
    },
    { rootMargin: '300px 0px' },
  )
  stopObserver = stop
})

onBeforeUnmount(() => {
  stopObserver?.()
  stopObserver = null
})
</script>

<template>
  <div ref="container">
    <UFormField
      :label="hasLabel ? themeTurnstile.label : undefined"
      :ui="{
        label:
          themeTurnstile.appearance !== 'interaction-only' && themeTurnstile.label
            ? ''
            : 'sr-only',
      }"
    >
      <NuxtTurnstile
        v-if="shouldRenderTurnstile"
        v-model="turnstileToken"
        class="max-w-xs overflow-x-hidden"
        :options="{ appearance: themeTurnstile.appearance, size: 'flexible' }"
      />
    </UFormField>
  </div>
</template>
