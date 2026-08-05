<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

defineOptions({
  inheritAttrs: false,
})

type DrupalLink = {
  url?: string
  linkUri?: string
  linkResolvableUri?: string
  props?: {
    url?: string
  }
}

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  iconName?: string
  header?: string
  headerTag?: string
  text?: string
  link?: DrupalLink
  direction?: string

  editLink?: string
}>()

const descriptionHtml = computed(() => trustedDrupalHtml(props.text))
const linkUrl = computed(() =>
  props.link?.url
  ?? props.link?.props?.url
  ?? props.link?.linkResolvableUri
  ?? props.link?.linkUri,
)
</script>

<template>
  <ParagraphReveal :id="id" as="div" class="h-full" :direction="direction">
    <EditLink class="h-full" :link="editLink" :parent-uuid="parentUuid">
      <UPageFeature
        as="article"
        class="h-full border border-default bg-elevated p-6 lg:p-8"
        :icon="iconName"
        orientation="vertical"
        :to="linkUrl"
      >
        <template v-if="header" #title>
          <component :is="headerTag || 'h3'">
            {{ header }}
          </component>
        </template>

        <template v-if="descriptionHtml" #description>
          <div class="prose max-w-none text-muted" v-html="descriptionHtml" />
        </template>
      </UPageFeature>
    </EditLink>
  </ParagraphReveal>
</template>
