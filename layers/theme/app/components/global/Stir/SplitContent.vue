<!--
  Stir Split Content

  An editable two-column content section for Canvas pages.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

defineProps<{
  heading?: string
  firstContent?: string
  secondContent?: string
  reverseOnMobile?: boolean
}>()
</script>

<template>
  <ParagraphLayout
    :container="true"
    direction="fade-up"
    grid-class="grid-cols-1 lg:grid-cols-2"
    :header="heading"
    header-tag="h2"
    layout="two_column"
    :reverse-mobile="reverseOnMobile"
    spacing="py-16"
    width="w-xl"
  >
    <template #first>
      <div class="prose max-w-none" v-html="trustedDrupalHtml(firstContent)" />
    </template>
    <template #second>
      <div class="prose max-w-none" v-html="trustedDrupalHtml(secondContent)" />
    </template>
  </ParagraphLayout>
</template>
