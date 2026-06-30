<script setup lang="ts">
import type { AppContextBlock } from '~/composables/useAppContext'

const { renderCustomElements, getPage } = useDrupalCe()
const page = getPage()
const props = defineProps<{ area: string }>()

const { data: appContext, execute: loadAppContext } = await useAppContext({ immediate: false })

function normalizeRegionBlocks(raw: unknown): AppContextBlock[] {
  if (Array.isArray(raw)) return raw as AppContextBlock[]
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, AppContextBlock>)
  }
  return []
}

const pageBlocks = computed(() => normalizeRegionBlocks(page.value?.blocks?.[props.area]))
const appContextBlocks = computed(() => normalizeRegionBlocks(appContext.value?.blocks?.[props.area]))

await loadAppContext()

const regionBlocks = computed<AppContextBlock[]>(() => {
  return appContextBlocks.value.length > 0 ? appContextBlocks.value : pageBlocks.value
})
</script>

<template>
  <component :is="renderCustomElements(regionBlocks)" v-if="regionBlocks.length" />
</template>
