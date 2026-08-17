<!--
  Stir Feature Grid

  A complete editable three-card section for Canvas pages.
  @status experimental
  @category Stir
-->
<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

const props = defineProps<{
  heading?: string
  intro?: string
  firstHeading?: string
  firstText?: string
  firstLinkLabel?: string
  firstLinkUrl?: string
  secondHeading?: string
  secondText?: string
  secondLinkLabel?: string
  secondLinkUrl?: string
  thirdHeading?: string
  thirdText?: string
  thirdLinkLabel?: string
  thirdLinkUrl?: string
}>()

const firstLink = computed(() => props.firstLinkUrl
  ? { linkTitle: props.firstLinkLabel || props.firstLinkUrl, linkUrl: props.firstLinkUrl }
  : undefined)
const secondLink = computed(() => props.secondLinkUrl
  ? { linkTitle: props.secondLinkLabel || props.secondLinkUrl, linkUrl: props.secondLinkUrl }
  : undefined)
const thirdLink = computed(() => props.thirdLinkUrl
  ? { linkTitle: props.thirdLinkLabel || props.thirdLinkUrl, linkUrl: props.thirdLinkUrl }
  : undefined)
</script>

<template>
  <ParagraphLayout
    :container="true"
    direction="fade-up"
    grid-class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    :header="heading"
    header-tag="h2"
    layout="three_column"
    spacing="py-16"
    width="w-xl"
  >
    <template v-if="intro" #top>
      <div class="prose max-w-none" v-html="trustedDrupalHtml(intro)" />
    </template>
    <template #first>
      <ParagraphFeature
        card-variant="outline"
        :header="firstHeading"
        header-tag="h3"
        :link="firstLink"
        :text="firstText"
      />
    </template>
    <template #second>
      <ParagraphFeature
        card-variant="outline"
        :header="secondHeading"
        header-tag="h3"
        :link="secondLink"
        :text="secondText"
      />
    </template>
    <template #third>
      <ParagraphFeature
        card-variant="outline"
        :header="thirdHeading"
        header-tag="h3"
        :link="thirdLink"
        :text="thirdText"
      />
    </template>
  </ParagraphLayout>
</template>
