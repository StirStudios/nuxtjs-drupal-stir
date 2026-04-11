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

const getBlockEditLink = (block: RegionBlock): string | undefined => {
  const editLink = block.props?.editLink

  return typeof editLink === 'string' && editLink.length > 0 ? editLink : undefined
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
  <template v-for="(block, index) in regionBlocks" :key="String(block.props?.uuid || index)">
    <EditLink :link="getBlockEditLink(block)">
      <component :is="renderCustomElements([block])" />
    </EditLink>
  </template>
</template>
