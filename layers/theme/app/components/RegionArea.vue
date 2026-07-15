<script setup lang="ts">
import type { AppContextBlock } from '~/composables/useAppContext'

const { renderCustomElements, getPage } = useDrupalCe()
const page = getPage()
const props = defineProps<{
  area: string
  as?: string
  ariaLabel?: string
}>()

const {
  data: appContextBlocks,
  execute: loadAppContextBlocks,
} = await useAppRegionBlocks(() => props.area, { immediate: false })

function normalizeRegionBlocks(raw: unknown): AppContextBlock[] {
  if (Array.isArray(raw)) return raw as AppContextBlock[]
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, AppContextBlock>)
  }
  return []
}

const pageBlocks = computed(() => normalizeRegionBlocks(page.value?.blocks?.[props.area]))

await loadAppContextBlocks()

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
