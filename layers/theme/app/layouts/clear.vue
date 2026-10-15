<script setup lang="ts">
import { hasPageHeroParagraph } from '#stir/utils/routeHero'

const { hasEditorialAccess } = usePageContext()
const { clearLayout, routeHero } = useAppConfig().stirTheme
const { hero } = useRouteHero()
const page = useStirDrupalCe().getPage()
// node--page drops the Hero paragraph when the route hero is on, so render it here.
const hasHeroParagraph = computed(() => hasPageHeroParagraph(page.value))
// Without an authored hero the page still needs exactly one h1, from its title.
const titleHero = computed(() => (hasHeroParagraph.value ? null : hero.value))
</script>

<template>
  <div class="flex min-h-dvh flex-col overflow-x-clip">
    <LazyDrupalTabs v-if="hasEditorialAccess" />
    <UMain id="main-content" as="main" class="flex-1" role="main" tabindex="-1">
      <LazyRouteHero v-if="routeHero.enabled && hasHeroParagraph" />
      <h1 v-else-if="titleHero" :class="titleHero.hideTitle ? 'sr-only' : clearLayout.title">
        {{ titleHero.title }}
      </h1>
      <slot />
    </UMain>
  </div>
</template>
