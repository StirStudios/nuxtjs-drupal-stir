<script setup lang="ts">
const { hero } = useRouteHero()
const displayedHero = useNavLockedSnapshot(hero)
</script>

<template>
  <RouteHeroSection v-if="displayedHero" :hero="displayedHero" />
</template>
