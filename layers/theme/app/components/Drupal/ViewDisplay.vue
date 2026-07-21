<script setup lang="ts">
import type { DrupalViewProps } from '#stir/types'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import { useSlotsToolkit } from '#stir/composables/useSlotsToolkit'
import type { RenderedDrupalViewRow } from '#stir/composables/useDrupalViewRows'
import { useDrupalViewRenderedRows } from '#stir/composables/useDrupalViewRows'
import {
  shouldPersistDrupalViewScroll,
  useDrupalViewScrollRestore,
} from '#stir/composables/useDrupalViewScrollRestore'

const props = defineProps<DrupalViewProps>()

const { renderCustomElements } = useStirDrupalCe()

defineSlots<{
  rows?(): unknown
  grid?(props: {
    rows: RenderedDrupalViewRow[]
    renderCustomElements: typeof renderCustomElements
    getRowMotionProps: typeof getRowMotionProps
    revealMotionKey: typeof revealMotionKey.value
    handleViewClick: typeof handleViewClick
  }): unknown
}>()

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const viewRoot = useTemplateRef<HTMLElement>('viewRoot')

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

const randomizeRowsOnClient = ref(false)
const trustedDynamicNoResults = computed(() =>
  trustedDrupalHtml(dynamicNoResults.value),
)

function resolveSlotRows() {
  const rows = tk.slot('rows')

  return rows.map((vnode, index) => ({
    ...vnode,
    key: vnode.key ?? `slide-${index}`,
  }))
}

const {
  dynamicRenderedRows,
  getRenderedRows,
  getStaticRows,
  hasDynamicRows,
  hasRows,
} = useDrupalViewRenderedRows({
  dynamicRows,
  randomizeEnabled,
  randomizeRowsOnClient,
  resolveSlotRows,
  shuffleRows: tk.shuffle,
})

function getCarouselRows(): unknown[] {
  if (hasDynamicRows.value) {
    return dynamicRenderedRows.value.map((row) => renderCustomElements(row.node))
  }

  return getStaticRows({ teaser: false })
}

watch(
  () => hasDynamicRows.value && dynamicRenderedRows.value.length > 0,
  (value, oldValue) => {
    if (!value || oldValue) return

    restoreScrollPosition()
  },
)

onMounted(() => {
  randomizeRowsOnClient.value = true
})
const hasMultipleFilters = computed(() => normalizedFilters.value.length > 1)
const scrollRestoreEnabled = computed(() =>
  !props.carousel && shouldPersistDrupalViewScroll(effectivePager.value?.totalPages),
)
const { getRevealDelayMs, getRevealMotionProps, revealMotionKey } = useRevealMotionConfig()
const { handleViewClick, restoreScrollPosition } = useDrupalViewScrollRestore(props, {
  currentPage,
  enabled: scrollRestoreEnabled,
  viewRoot,
})

const getRowMotionProps = (index: number) =>
  getRevealMotionProps(
    props.direction,
    getRevealDelayMs(index, { mode: 'dense' }),
    { ssrVisible: true },
  )

</script>

<template>
  <section ref="viewRoot" class="scroll-mt-24">
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
    <LazyParagraphCarousel
      v-if="carousel"
      :id="`${viewId}-${displayId}`"
      :carousel-arrows="carouselArrows"
      :carousel-autoheight="carouselAutoheight"
      :carousel-autoscroll="carouselAutoscroll"
      :carousel-fade="carouselFade"
      :carousel-indicators="carouselIndicators"
      :carousel-interval="carouselInterval"
      :grid-items="gridItems"
      hydrate-on-visible
      :items="getCarouselRows()"
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

    <slot
    v-else-if="hasRows() && vueSlots.grid"
    :get-row-motion-props="getRowMotionProps"
    :handle-view-click="handleViewClick"
    name="grid"
    :render-custom-elements="renderCustomElements"
    :reveal-motion-key="revealMotionKey"
    :rows="getRenderedRows({ teaser: false })"
  />

    <WrapGrid
    v-else-if="hasRows()"
    :classes="rowsWrapper"
    :container="container"
    :grid-items="gridItems"
    :spacing="spacing"
    :width="width"
  >
    <RevealMotion
      v-for="(row, i) in getRenderedRows()"
      :key="`${row.key}-${revealMotionKey}`"
      as="div"
      class="item"
      v-bind="getRowMotionProps(i)"
      @click.capture="handleViewClick"
    >
      <component
        :is="row.type === 'dynamic' ? renderCustomElements(row.node) : row.node"
      />
    </RevealMotion>
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
      <span
        v-if="trustedDynamicNoResults"
        v-html="trustedDynamicNoResults"
      />
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
  </section>
</template>
