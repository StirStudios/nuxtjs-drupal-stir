<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import {
  resolveUiButtonVariant,
  type UiButtonVariant,
} from '#stir/utils/nuxtUiProps'

type ScrollButtonTheme = {
  showAtScrollY?: number
  base?: string
  variant?: UiButtonVariant
  icon?: string
}

const { y } = useWindowScroll()
const appConfig = useAppConfig()

const theme = computed<Required<ScrollButtonTheme>>(() => {
  const configured = (appConfig.stirTheme?.scrollButton || {}) as ScrollButtonTheme

  return {
    showAtScrollY: Number(configured.showAtScrollY ?? 200),
    base:
      configured.base ||
      'fixed right-6 bottom-6 z-40 rounded-full transition-opacity duration-300',
    variant: resolveUiButtonVariant(configured.variant, 'soft'),
    icon: configured.icon || 'i-lucide-chevron-up',
  }
})

const showButton = computed(() => y.value > theme.value.showAtScrollY)

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
