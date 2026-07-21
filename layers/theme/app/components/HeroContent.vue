<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

const props = withDefaults(
  defineProps<{
    pageTitle?: string
    subtitle?: string
    heroText?: string
    isFront?: boolean
  }>(),
  {
    pageTitle: '',
    subtitle: '',
    heroText: '',
    isFront: false,
  },
)

const trustedHeroText = computed(() => trustedDrupalHtml(props.heroText))

defineSlots<{ button?(): unknown }>()
</script>

<template>
  <template v-if="pageTitle && isFront">
    <h1>{{ pageTitle }}</h1>
    <h2 class="display-h1 text-left">{{ subtitle }}</h2>
  </template>

  <h1 v-else-if="pageTitle" class="mb-0 text-white">
    {{ pageTitle }}
  </h1>

  <div
    v-if="trustedHeroText"
    class="hero-copy prose"
    v-html="trustedHeroText"
  />

  <slot name="button" />
</template>
