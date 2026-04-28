<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import type { VNode } from 'vue'

defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  editLink?: string
}>()

const vueSlots = useSlots()
const active = ref<string>('0')
const contentRef = ref<HTMLElement | null>(null)
const tabNodes = computed<VNode[]>(() => {
  const nodes = vueSlots.tab?.()

  return Array.isArray(nodes) ? (nodes as VNode[]) : []
})

type TabsItem = { label: string; value: string }

const items = computed<TabsItem[]>(() =>
  tabNodes.value.map((tab, index) => ({
    label: tab.props?.title ?? `Tab ${index + 1}`,
    value: String(index),
  })),
)

const activeTabNode = computed(() => {
  const index = Number(active.value)

  return tabNodes.value[index] ?? null
})

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1024 })
const isMobile = breakpoints.smaller('lg')
const orientation = computed(() => (isMobile.value ? 'horizontal' : 'vertical'))

watch(active, async () => {
  if (!isMobile.value) return

  await nextTick()

  contentRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
})
</script>

<template>
  <div v-if="items.length <= 1">
    <component :is="activeTabNode" v-if="activeTabNode" />
  </div>

  <UTabs
    v-else
    v-model="active"
    :items="items"
    :orientation="orientation"
    :ui="{
      root: 'items-start gap-2 m-auto w-full',
      list: 'flex-wrap lg:flex-col overflow-x-auto lg:overflow-visible mb-10 pb-10 lg:mb-0 lg:pb-0 border-inverted/30',
      content: 'flex-1 min-w-0',
      trigger: 'w-full lg:px-10 py-2 tabs font-bold uppercase',
      marker: 'bg-primary',
    }"
    variant="link"
  >
    <template #content>
      <div ref="contentRef">
        <component :is="activeTabNode" v-if="activeTabNode" />
      </div>
    </template>
  </UTabs>
</template>
