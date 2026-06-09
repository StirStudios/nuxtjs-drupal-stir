<script setup lang="ts">
import type { LayoutContextBlock } from '~/composables/useLayoutContext'

const { renderCustomElements, getPage } = useDrupalCe()
const page = getPage()
const props = defineProps<{ area: string }>()

const { data: layoutContext, execute: loadLayoutContext } = await useLayoutContext({ immediate: false })

function normalizeRegionBlocks(raw: unknown): LayoutContextBlock[] {
  if (Array.isArray(raw)) return raw as LayoutContextBlock[]
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, LayoutContextBlock>)
  }
  return []
}

const hasPageBlocksPayload = computed(() => Boolean(page.value?.blocks && typeof page.value.blocks === 'object'))
const pageBlocks = computed(() => normalizeRegionBlocks(page.value?.blocks?.[props.area]))
const needsLayoutContext = computed(() => !hasPageBlocksPayload.value)

if (needsLayoutContext.value) {
  await loadLayoutContext()
}

watch(needsLayoutContext, (needsContext) => {
  if (needsContext) {
    void loadLayoutContext()
  }
})

const regionBlocks = computed<LayoutContextBlock[]>(() => {
  if (hasPageBlocksPayload.value) return pageBlocks.value

  return normalizeRegionBlocks(layoutContext.value?.blocks?.[props.area])
})
</script>

<template>
  <component :is="renderCustomElements(regionBlocks)" v-if="regionBlocks.length" />
</template>
