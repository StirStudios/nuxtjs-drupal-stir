<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind, useScroll } from '@vueuse/core'
import type { ComponentPublicInstance, VNode } from 'vue'

defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  direction?: string
  editLink?: string
}>()

const vueSlots = useSlots()
const active = ref<string>('0')
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

// Smaller screens: the tabs scroll sideways in one row, fading the edge on
// whichever side has more, with the active tab kept in view.
const tabs = useTemplateRef<ComponentPublicInstance>('tabs')
const tabList = computed(
  () =>
    (tabs.value?.$el as HTMLElement | undefined)?.querySelector<HTMLElement>(
      '[role="tablist"]',
    ) ?? null,
)
const { arrivedState, measure } = useScroll(tabList)
const listFade = computed(() =>
  isMobile.value
    ? [
        !arrivedState.left && 'mask-l-from-[calc(100%-3rem)]',
        !arrivedState.right && 'mask-r-from-[calc(100%-3rem)]',
      ]
    : [],
)

watch([tabList, isMobile], () => nextTick(measure))

watch(active, async () => {
  if (!isMobile.value) return
  await nextTick()
  tabList.value
    ?.querySelector<HTMLElement>('[data-state="active"]')
    ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
})
</script>

<template>
  <ParagraphReveal :id="id" class="w-full" :direction="direction">
    <PageRevealScope>
      <template v-if="items.length <= 1">
        <component :is="activeTabNode" v-if="activeTabNode" />
      </template>

      <UTabs
        v-else
        ref="tabs"
        v-model="active"
        :items="items"
        :orientation="orientation"
        :ui="{
          root: 'app-tabs items-start gap-2 m-auto w-full data-[orientation=horizontal]:overflow-y-clip',
          list: [
            'overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible mb-8 lg:mb-0 border-inverted/30',
            listFade,
          ],
          content: 'flex-1 min-w-0 [&_ul]:pt-0 [&_p]:pb-0',
          trigger:
            'shrink-0 whitespace-nowrap lg:w-full lg:whitespace-normal lg:px-10 py-2 tabs font-bold uppercase',
          indicator: 'bg-primary',
        }"
        variant="link"
      >
        <template #content>
          <component :is="activeTabNode" v-if="activeTabNode" />
        </template>
      </UTabs>
    </PageRevealScope>
  </ParagraphReveal>
</template>
