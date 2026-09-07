<script setup lang="ts">
import type { AppContextBlock } from '#stir/composables/useAppContext'

const { renderCustomElements, getPage } = useStirDrupalCe()
const page = getPage()
const props = defineProps<{
  area: string
  as?: string
  ariaLabel?: string
}>()

const {
  data: appContextBlocks,
  status: appContextStatus,
  execute: loadAppContextBlocks,
} = useAppRegionBlocks(() => props.area, { immediate: false })

function normalizeRegionBlocks(raw: unknown): AppContextBlock[] {
  if (Array.isArray(raw)) return raw as AppContextBlock[]
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, AppContextBlock>)
  }
  return []
}

const pageBlocks = computed(() => normalizeRegionBlocks(page.value?.blocks?.[props.area]))

function loadMissingBlocks() {
  if (appContextStatus.value !== 'success') return loadAppContextBlocks()
}

onServerPrefetch(loadMissingBlocks)
if (import.meta.client) void loadMissingBlocks()

const regionBlocks = computed<AppContextBlock[]>(() => {
  return appContextBlocks.value?.length ? appContextBlocks.value : pageBlocks.value
})
</script>

<template>
  <template v-if="regionBlocks.length">
    <component :is="as" v-if="as" :aria-label="ariaLabel">
      <component :is="renderCustomElements(regionBlocks)" />
    </component>

    <component :is="renderCustomElements(regionBlocks)" v-else />
  </template>
</template>
