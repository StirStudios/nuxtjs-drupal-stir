<!--
  Stir Call To Action

  A complete editable call-to-action section for Canvas pages.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

defineProps<{
  heading?: string
  /**
   * Supporting copy
   * @contentMediaType text/html
   * @formattingContext block
   */
  text?: string
  buttonLabel?: string
  /**
   * Button destination
   * @format uri-reference
   */
  buttonUrl?: string
}>()
</script>

<template>
  <ParagraphLayout
    :card="true"
    :container="true"
    direction="fade"
    grid-class="grid-cols-1"
    :header="heading"
    header-tag="h2"
    layout="one_column"
    spacing="py-16"
    width="w-lg"
  >
    <template #first>
      <div class="prose mx-auto max-w-none text-center" v-html="trustedDrupalHtml(text)" />
      <div class="flex justify-center pt-5">
        <UButton
          v-if="buttonLabel && buttonUrl"
          color="primary"
          :label="buttonLabel"
          size="xl"
          :to="buttonUrl"
          variant="solid"
        />
      </div>
    </template>
  </ParagraphLayout>
</template>
