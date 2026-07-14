<script setup lang="ts">
import type { WebformProps } from '~/types'

const props = defineProps<WebformProps>()
</script>

<template>
  <LazyWebformForm v-bind="props" hydrate-on-visible />
</template>
