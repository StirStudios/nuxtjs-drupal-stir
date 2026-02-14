<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  editLink?: string
}>()

const vueSlots = useSlots()
const active = ref<string | number>('0')
type TabsItem = { label: string; value: string }
const tabNodes = computed(() => {
  const nodes = vueSlots.tab?.()
  return Array.isArray(nodes) ? nodes : []
})

const items = computed<TabsItem[]>(() =>
  tabNodes.value.map((tab, index) => ({
    label: tab.props?.title ?? `Tab ${index + 1}`,
    value: String(index),
  })),
)

const activeTabNode = computed(() => {
  const index = Number(active.value)
  return tabNodes.value[index]
})

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const isMobile = breakpoints.smaller('lg')
const orientation = computed(() => (isMobile.value ? 'horizontal' : 'vertical'))
</script>

<template>
  <EditLink :link="editLink">
    <UTabs
      v-if="items.length"
      v-model="active"
      :items="items"
      :orientation="orientation"
      :ui="{
        root: 'items-start gap-2 m-auto w-full',
        list: 'flex-wrap lg:flex-col overflow-x-auto lg:overflow-visible mb-10 pb-10 lg:mb-0 lg:pb-0 border-inverted/30',
        trigger: 'w-full lg:px-10 py-2 tabs font-bold uppercase',
        marker: 'bg-primary',
      }"
      variant="link"
    >
      <template #content>
        <component :is="activeTabNode" v-if="activeTabNode" />
      </template>
    </UTabs>
  </EditLink>
</template>
