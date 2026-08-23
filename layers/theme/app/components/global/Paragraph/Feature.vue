<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'
import { resolveDrupalLink, type DrupalLink } from '#stir/utils/drupalLink'
import { resolveUiPageCardVariant } from '#stir/utils/nuxtUiProps'

defineOptions({
  inheritAttrs: false,
})

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
  cardVariant?: string
  direction?: string

  editLink?: string
}>()

const descriptionHtml = computed(() => trustedDrupalHtml(props.text))
const linkData = computed(() => resolveDrupalLink(props.link))
const hasAction = computed(() => !!linkData.value.url && !!linkData.value.title)
const cardLink = computed(() => hasAction.value ? undefined : linkData.value.url)
const cardVariant = computed(() => resolveUiPageCardVariant(props.cardVariant))
</script>

<template>
  <ParagraphReveal :id="id" as="div" class="h-full" :direction="direction">
    <EditLink :id="id" class="h-full" :link="editLink" :parent-uuid="parentUuid">
      <UPageCard
        as="article"
        class="paragraph-feature h-full"
        :icon="iconName"
        orientation="vertical"
        :rel="cardLink && linkData.external ? 'noopener noreferrer' : undefined"
        :target="cardLink && linkData.external ? '_blank' : undefined"
        :to="cardLink"
        :variant="cardVariant"
      >
        <template v-if="header" #title>
          <component :is="headerTag || 'h3'">
            {{ header }}
          </component>
        </template>

        <template v-if="descriptionHtml" #description>
          <div class="prose max-w-none text-muted" v-html="descriptionHtml" />
        </template>

        <template v-if="hasAction" #footer>
          <UButton
            class="paragraph-feature-action"
            color="neutral"
            :label="linkData.title"
            :rel="linkData.external ? 'noopener noreferrer' : undefined"
            :target="linkData.external ? '_blank' : undefined"
            :to="linkData.url"
            trailing-icon="i-lucide-arrow-right"
            variant="link"
          />
        </template>
      </UPageCard>
    </EditLink>
  </ParagraphReveal>
</template>
