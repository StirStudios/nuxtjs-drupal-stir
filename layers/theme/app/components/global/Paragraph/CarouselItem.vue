<script setup lang="ts">
import { cloneVNode, type VNode } from 'vue'
import { resolveDrupalLink, type DrupalLink } from '#stir/utils/drupalLink'

const props = defineProps<{
  label?: string
  link?: DrupalLink
}>()

const slots = useSlots()
const linkData = computed(() => resolveDrupalLink(props.link))
const media = computed(() =>
  (slots.media?.() ?? []).map((node) =>
    cloneVNode(node as VNode, { link: undefined }),
  ),
)
const hasContent = computed(() => Boolean(props.label?.trim() || media.value.length))
</script>

<template>
  <ULink
    v-if="hasContent && linkData.url"
    class="flex items-center gap-3 text-default no-underline"
    :rel="linkData.external ? 'noopener noreferrer' : undefined"
    :target="linkData.external ? '_blank' : undefined"
    :to="linkData.url"
  >
    <component :is="node" v-for="(node, index) in media" :key="node.key ?? index" />
    <span v-if="label" class="whitespace-nowrap">{{ label }}</span>
  </ULink>

  <div v-else-if="hasContent" class="flex items-center gap-3">
    <component :is="node" v-for="(node, index) in media" :key="node.key ?? index" />
    <span v-if="label" class="whitespace-nowrap">{{ label }}</span>
  </div>
</template>
