<script setup lang="ts">
import type { LayoutContextBlock } from '~/composables/useLayoutContext'

const { renderCustomElements, getPage } = useDrupalCe()
const page = getPage()
const props = defineProps<{ area: string }>()

const { data: layoutContext } = await useLayoutContext()

function normalizeRegionBlocks(raw: unknown): LayoutContextBlock[] {
  if (Array.isArray(raw)) return raw as LayoutContextBlock[]
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, LayoutContextBlock>)
  }
  return []
}

const regionBlocks = computed<LayoutContextBlock[]>(() => {
  const pageBlocks = normalizeRegionBlocks(page.value?.blocks?.[props.area])

  if (pageBlocks.length) return pageBlocks

  return normalizeRegionBlocks(layoutContext.value?.blocks?.[props.area])
})
</script>

<template>
  <component :is="renderCustomElements(regionBlocks)" v-if="regionBlocks.length" />
</template>
