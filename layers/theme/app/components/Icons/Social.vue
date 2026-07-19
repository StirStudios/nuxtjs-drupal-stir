<script setup lang="ts">
import type { SocialIcon } from '#stir/types'

const props = defineProps<SocialIcon>()
const iconSize = props.iconSize || 'size-8'
</script>

<template>
  <ULink
    v-if="url && icon"
    :aria-label="`Visit our ${title} page`"
    inactive-class="transition-colors hover:text-primary"
    raw
    rel="noopener noreferrer"
    target="_blank"
    :to="url"
  >
    <UIcon aria-hidden="true" :class="['mx-1', iconSize]" :name="icon" />
  </ULink>
</template>
