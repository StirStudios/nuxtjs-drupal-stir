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

const hasPageBlocksPayload = computed(() => Boolean(page.value?.blocks && typeof page.value.blocks === 'object'))
const pageBlocks = computed(() => normalizeRegionBlocks(page.value?.blocks?.[props.area]))
const needsAppContext = computed(() => !hasPageBlocksPayload.value)

if (needsAppContext.value) {
  await loadAppContext()
}

watch(needsAppContext, (needsContext) => {
  if (needsContext) {
    void loadAppContext()
  }
})

const regionBlocks = computed<AppContextBlock[]>(() => {
  if (hasPageBlocksPayload.value) return pageBlocks.value

  return normalizeRegionBlocks(appContext.value?.blocks?.[props.area])
})
</script>

<template>
  <component :is="renderCustomElements(regionBlocks)" v-if="regionBlocks.length" />
</template>
