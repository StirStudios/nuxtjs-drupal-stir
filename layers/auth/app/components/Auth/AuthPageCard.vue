<script setup lang="ts">
import type { AuthThemeConfig } from '../../types/theme'
import { resolveAuthCardConfig, resolveAuthPageKey } from '../../utils/authTheme'

const props = withDefaults(defineProps<{
  headerFull?: boolean
  split?: boolean
}>(), {
  headerFull: false,
  split: false,
})

const route = useRoute()
const appConfig = useAppConfig()
const authTheme = computed<AuthThemeConfig>(() =>
  ((appConfig.stirTheme || {}) as { auth?: AuthThemeConfig }).auth || {},
)
const pageKey = computed(() => resolveAuthPageKey(route))
const cardConfig = computed(() =>
  resolveAuthCardConfig(authTheme.value, pageKey.value),
)
const cardClass = computed(() => cardConfig.value.class || 'shadow-lg')
const cardUi = computed(() => {
  const ui = {
    container: props.split ? 'p-0 sm:p-0' : 'p-6 sm:p-6',
    footer: 'text-center text-sm text-muted',
    wrapper: 'w-full',
    ...cardConfig.value.ui,
    ...(props.headerFull ? { header: 'w-full' } : {}),
  }

  // Flex children default to min-width: auto, so one wide child (a long
  // unbroken label) would stretch the card past its max width. A theme's own
  // container or wrapper classes keep this.
  return {
    ...ui,
    container: [ui.container, 'min-w-0'].filter(Boolean).join(' '),
    wrapper: [ui.wrapper, 'min-w-0'].filter(Boolean).join(' '),
  }
})
</script>

<template>
  <UPageCard
    class="w-full"
    :class="[cardClass, { 'overflow-hidden text-left': split }]"
    :ui="cardUi"
    :variant="cardConfig.variant || 'outline'"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UPageCard>
</template>
