<script setup lang="ts">
const { renderCustomElements, getPage } = useDrupalCe()
const page = getPage()
const props = defineProps<{ area: string }>()

type RegionBlock = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  [key: string]: unknown
}

const regionBlocks = computed<RegionBlock[]>(() => {
  const raw = page.value?.blocks?.[props.area]

  if (Array.isArray(raw)) return raw as RegionBlock[]
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, RegionBlock>)
  }
  return []
})
</script>

<template>
  <component :is="renderCustomElements(regionBlocks)" v-if="regionBlocks.length" />
</template>
