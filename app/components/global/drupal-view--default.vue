<script setup lang="ts">
import { Motion } from 'motion-v'
import type { VNode } from 'vue'
import { cloneVNode } from 'vue'
import type {
  ExposedFilter,
  ExposedSort,
  ViewPager,
} from '~/composables/useDrupalViewControls'
import { useRevealMotionConfig } from '~/composables/useRevealMotionConfig'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'

interface CeElementNode {
  props?: Record<string, unknown>
  [key: string]: unknown
}

type RenderedViewRow =
  | {
      key: string
      type: 'dynamic'
      node: unknown
    }
  | {
      key: string
      type: 'static'
      node: VNode
    }

const props = defineProps<{
  title?: string
  gridItems?: string
  rowsWrapper?: string
  width?: string
  spacing?: string
  container?: boolean
  viewId?: string
  displayId?: string
  parentUuid?: string
  pager?: ViewPager | unknown
  randomize?: boolean | string
  carousel?: boolean
  carouselArrows?: boolean
  carouselAutoheight?: boolean
  carouselAutoscroll?: boolean
  carouselFade?: boolean
  carouselIndicators?: boolean
  carouselInterval?: number
  direction?: string
  exposedFilters?: ExposedFilter[] | unknown[]
  exposedSorts?: ExposedSort[] | unknown[]
  noResults?: string
}>()

const { renderCustomElements } = useDrupalCe()
const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)

const {
  isLoading,
  loadError,
  dynamicRows,
  dynamicNoResults,
  filterValues,
  sortValues,
  currentPage,
  effectivePager,
  normalizedFilters,
  primarySort,
  sortByOptions,
  sortOrderOptions,
  hasControls,
  retryCurrentPage,
  onFilterChange,
  onSortChange,
  onPageChange,
  resetControls,
} = useDrupalViewControls(props)

const randomizeEnabled = computed(() => {
  if (props.randomize === true) return true
  if (typeof props.randomize === 'string') {
    const value = props.randomize.trim().toLowerCase()

    return value === 'true' || value === '1'
  }

  return false
})

const rawRows = computed(() => tk.slot('rows'))
const orderedRows = computed(() =>
  rawRows.value.map((vnode, index) => ({
    ...vnode,
    key: vnode.key ?? `slide-${index}`,
  })),
)
const randomizedRows = tk.hydrateOrder(
  () => orderedRows.value,
  () =>
    tk.shuffle(rawRows.value).map((vnode, index) => ({
      ...vnode,
      key: vnode.key ?? `slide-${index}`,
    })),
)
const slotRows = computed(() =>
  randomizeEnabled.value ? randomizedRows.value : orderedRows.value,
)

const staticTeaserRows = computed(() =>
  slotRows.value.map((node) =>
    cloneVNode(node as VNode, { isHero: false, type: 'teaser' }, true),
  ),
)

const hasDynamicRows = computed(() => dynamicRows.value !== null)
const dynamicRenderedRows = computed(() => {
  const rows = dynamicRows.value

  if (!rows) return []

  return rows.map((row, index) => {
    if (
      row &&
      typeof row === 'object' &&
      'props' in (row as Record<string, unknown>) &&
      typeof (row as CeElementNode).props === 'object'
    ) {
      const node = row as CeElementNode
      const patched: CeElementNode = {
        ...node,
        props: {
          isHero: false,
          ...node.props,
          type: 'teaser',
        },
      }

      return {
        key: String(node.props?.uuid || node.props?.id || index),
        node: patched,
      }
    }

    return {
      key: String(index),
      node: row,
    }
  })
})

const hasRows = computed(() =>
  hasDynamicRows.value
    ? dynamicRenderedRows.value.length > 0
    : staticTeaserRows.value.length > 0,
)
const renderedRows = computed<RenderedViewRow[]>(() => {
  if (hasDynamicRows.value) {
    return dynamicRenderedRows.value.map((row) => ({
      key: row.key,
      type: 'dynamic',
      node: row.node,
    }))
  }

  return staticTeaserRows.value.map((node, index) => ({
    key: String(node.key ?? index),
    type: 'static',
    node: node as VNode,
  }))
})
const hasMultipleFilters = computed(() => normalizedFilters.value.length > 1)
const { getRevealDelayMs, getRevealMotionProps, revealMotionKey } = useRevealMotionConfig()

const getRowMotionProps = (index: number) =>
  getRevealMotionProps(
    props.direction,
    props.direction ? getRevealDelayMs(index, { mode: 'dense' }) : getRevealDelayMs(index),
    { ssrVisible: true },
  )
</script>

<template>
  <h2 v-if="title" class="text-highlighted mb-4 text-2xl font-semibold">
    {{ title }}
  </h2>

  <div v-if="hasControls && !carousel" class="mb-6 space-y-4">
    <div class="flex flex-wrap items-end gap-3">
      <div class="min-w-0 flex-1">
        <DrupalViewsFilters
          :filters="normalizedFilters"
          :values="filterValues"
          @change="onFilterChange"
        />
      </div>

      <div class="flex items-end gap-3">
        <DrupalViewsSort
          :sort-by-key="primarySort?.queryParamSortBy"
          :sort-by-label="primarySort?.label"
          :sort-by-options="sortByOptions"
          :sort-order-key="primarySort?.queryParamSortOrder"
          sort-order-label="Sort order"
          :sort-order-options="sortOrderOptions"
          :values="sortValues"
          @change="onSortChange"
        />

        <UButton
          v-if="hasMultipleFilters"
          class="h-10"
          color="neutral"
          icon="i-lucide-rotate-ccw"
          size="md"
          variant="outline"
          @click="resetControls"
        >
          Reset filters
        </UButton>
      </div>
    </div>
  </div>

  <ParagraphCarousel
    v-if="carousel"
    :carousel-arrows="carouselArrows"
    :carousel-autoheight="carouselAutoheight"
    :carousel-autoscroll="carouselAutoscroll"
    :carousel-fade="carouselFade"
    :carousel-indicators="carouselIndicators"
    :carousel-interval="carouselInterval"
    :grid-items="gridItems"
    :items="slotRows"
    :randomize="randomizeEnabled"
    :spacing="spacing"
    :width="width"
  />

  <WrapGrid
    v-else-if="isLoading"
    :classes="rowsWrapper"
    :container="container"
    :grid-items="gridItems"
    :spacing="spacing"
    :width="width"
  >
    <div v-for="index in 6" :key="`skeleton-${index}`" class="item">
      <div class="space-y-4">
        <USkeleton class="aspect-[16/9] w-full rounded-lg" />
        <USkeleton class="h-5 w-10/12 rounded" />
        <USkeleton class="h-4 w-8/12 rounded" />
      </div>
    </div>
  </WrapGrid>

  <WrapGrid
    v-else-if="hasRows"
    :classes="rowsWrapper"
    :container="container"
    :grid-items="gridItems"
    :spacing="spacing"
    :width="width"
  >
    <Motion
      v-for="(row, i) in renderedRows"
      :key="`${row.key}-${revealMotionKey}`"
      as="div"
      class="item"
      v-bind="getRowMotionProps(i)"
    >
      <component
        :is="row.type === 'dynamic' ? renderCustomElements(row.node) : row.node"
      />
    </Motion>
  </WrapGrid>

  <UEmpty
    v-else-if="loadError"
    description="Please try again."
    icon="i-lucide-alert-triangle"
    title="Unable to load results"
    variant="subtle"
  >
    <template #actions>
      <UButton color="neutral" variant="outline" @click="retryCurrentPage">
        Try again
      </UButton>
    </template>
  </UEmpty>

  <UEmpty
    v-else
    icon="i-lucide-search-x"
    title="No results found"
    :ui="{
      title: 'text-highlighted text-pretty font-medium mb-0',
    }"
    variant="subtle"
  >
    <template #description>
      <span v-if="dynamicNoResults" v-html="dynamicNoResults" />
      <span v-else>Try changing filters or reset to defaults.</span>
    </template>

    <template #actions>
      <UButton
        v-if="hasMultipleFilters"
        color="neutral"
        variant="outline"
        @click="resetControls"
      >
        Reset filters
      </UButton>
    </template>
  </UEmpty>

  <DrupalViewsPagination
    v-if="effectivePager && !carousel && effectivePager.totalPages > 1"
    class="mt-8"
    :current="currentPage"
    :total-pages="effectivePager.totalPages"
    @update:current="onPageChange"
  />
</template>
