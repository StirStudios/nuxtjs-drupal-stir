<!--
  Stir Hero

  A governed page hero with semantic content, media, and call-to-action slots.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
defineProps<{
  eyebrow?: string
  heading?: string
  text?: string
  imageUrl?: string
  imageAlt?: string
  animation?: 'none' | 'fade' | 'fade-up' | 'fade-down'
}>()

defineSlots<{
  media?(): unknown
  actions?(): unknown
}>()

const { hero: heroTheme } = useAppConfig().stirTheme
</script>

<template>
  <ParagraphHero
    :direction="animation === 'none' ? undefined : animation"
    :header="eyebrow"
    :text="text"
  >
    <template v-if="heading" #title>
      <h1>{{ heading }}</h1>
    </template>
    <template #media>
      <img
        v-if="imageUrl"
        :alt="imageAlt || ''"
        :class="heroTheme.image?.base"
        :src="imageUrl"
      >
      <slot name="media" />
    </template>
    <template #button>
      <slot name="actions" />
    </template>
  </ParagraphHero>
</template>
