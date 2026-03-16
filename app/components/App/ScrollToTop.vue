<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()
const theme = useAppConfig().stirTheme.scrollButton
const showButton = computed(() => y.value > (theme.showAtScrollY ?? 200))

const scrollToTop = () => {
  if (!import.meta.client) return

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })
}
</script>

<template>
  <ClientOnly>
    <UButton
      :aria-hidden="!showButton"
      aria-label="Scroll to top of page"
      :class="[
        theme.base,
        showButton
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0',
      ]"
      :tabindex="showButton ? 0 : -1"
      :variant="theme.variant"
      @click="scrollToTop"
    >
      <UIcon aria-hidden="true" class="size-7" :name="theme.icon" />
      <span class="sr-only">Scroll to top of page</span>
    </UButton>
  </ClientOnly>
</template>
