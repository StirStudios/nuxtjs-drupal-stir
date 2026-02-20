<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

const props = withDefaults(
  defineProps<{
    pageTitle?: string
    siteSlogan?: string
    heroText?: string
    isFront?: boolean
  }>(),
  {
    pageTitle: '',
    siteSlogan: '',
    heroText: '',
    isFront: false,
  },
)

const safeHeroText = computed(() => cleanHTML(props.heroText ?? ''))

defineSlots<{ button?(): unknown }>()
</script>

<template>
  <template v-if="pageTitle && isFront">
    <h1>{{ pageTitle }}</h1>
    <h2 class="display-h1 text-left">{{ siteSlogan }}</h2>
  </template>

  <h1 v-else-if="pageTitle" class="mb-0 text-white">
    {{ pageTitle }}
  </h1>

  <div v-if="safeHeroText" class="hero-copy prose" v-html="safeHeroText" />

  <slot name="button" />
</template>
