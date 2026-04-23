<script setup lang="ts">
import useDarkMode from '~/composables/useDarkMode'
import { resolveColorModeState } from '~/utils/colorMode'

const appConfig = useAppConfig()
const { isDark } = useDarkMode()
const route = useRoute()

const hideToggle = computed(() =>
  resolveColorModeState(appConfig.colorMode, route.path).hideToggle,
)
</script>

<template>
  <ClientOnly v-if="!hideToggle">
    <UButton
      aria-label="Theme"
      color="black"
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      size="lg"
      variant="ghost"
      @click="isDark = !isDark"
    />

    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>
