<script setup lang="ts">
const { renderCustomElements } = useDrupalCe()
const { page } = usePageContext()
const props = defineProps<{ area: string }>()

type RegionBlock = {
  uuid?: string
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
  <template v-for="(block, index) in regionBlocks" :key="block.uuid || index">
    <component :is="renderCustomElements(block)" v-if="block" />
  </template>
</template>
