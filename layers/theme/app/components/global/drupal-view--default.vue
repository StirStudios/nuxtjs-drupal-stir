<script setup lang="ts">
import { Motion } from 'motion-v'
import type { VNode } from 'vue'
import { cloneVNode } from 'vue'
import type {
  ExposedFilter,
  ExposedSort,
  ViewPager,
} from '~/composables/useDrupalViewControls'
import type { CustomElementNode } from '~/types'
import { useRevealMotionConfig } from '~/composables/useRevealMotionConfig'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'

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
  args?: unknown
  exposedFilters?: ExposedFilter[] | unknown[]
  exposedSorts?: ExposedSort[] | unknown[]
  restoreScrollLinkPattern?: string
  noResults?: string
}>()

const { renderCustomElements } = useDrupalCe()
const route = useRoute()
const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const viewRoot = useTemplateRef<HTMLElement>('viewRoot')
const restoredScrollPosition = ref(false)
const isHistoryNavigation = ref(false)
const restoreTargetKey = 'stir:view-scroll-restore-target'

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

const hasDynamicRows = computed(() => dynamicRows.value !== null)
const dynamicRenderedRows = computed(() => {
  const rows = dynamicRows.value

  if (!rows) return []

  return rows.map((row, index) => {
    if (
      row &&
      typeof row === 'object' &&
      'props' in (row as Record<string, unknown>) &&
      typeof (row as CustomElementNode).props === 'object'
    ) {
      const node = row as CustomElementNode
      const patched: CustomElementNode = {
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

function hasRows(): boolean {
  return hasDynamicRows.value
    ? dynamicRenderedRows.value.length > 0
    : getStaticRows().length > 0
}

const randomizeRowsOnClient = ref(false)

function resolveSlotRows() {
  const rows = tk.slot('rows')

  return rows.map((vnode, index) => ({
    ...vnode,
    key: vnode.key ?? `slide-${index}`,
  }))
}

function getStaticRows() {
  const rows = randomizeEnabled.value && randomizeRowsOnClient.value
    ? tk.shuffle(resolveSlotRows())
    : resolveSlotRows()

  return rows.map((node) => cloneVNode(node as VNode, { isHero: false, type: 'teaser' }, true))
}

function getRenderedRows(): RenderedViewRow[] {
  if (hasDynamicRows.value) {
    return dynamicRenderedRows.value.map((row) => ({
      key: row.key,
      type: 'dynamic',
      node: row.node,
    }))
  }

  return getStaticRows().map((node, index) => ({
    key: String(node.key ?? index),
    type: 'static',
    node: node as VNode,
  }))
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
const { getRevealDelayMs, getRevealMotionProps, revealMotionKey } = useRevealMotionConfig()

const getRowMotionProps = (index: number) =>
  getRevealMotionProps(
    props.direction,
    props.direction ? getRevealDelayMs(index, { mode: 'dense' }) : getRevealDelayMs(index),
    { ssrVisible: true },
  )

function scrollStorageKeyFor(fullPath = route.fullPath) {
  return [
    'stir:view-scroll',
    fullPath,
    props.viewId || '',
    props.displayId || '',
    props.parentUuid || '',
  ].join(':')
}

function saveScrollPosition(key = scrollStorageKeyFor()) {
  if (!import.meta.client) return

  sessionStorage.setItem(
    key,
    JSON.stringify({
      top: window.scrollY,
      savedAt: Date.now(),
    }),
  )
}

function restoreScrollPosition() {
  if (
    !import.meta.client ||
    restoredScrollPosition.value
  ) {
    return
  }

  const shouldRestore =
    isHistoryNavigation.value ||
    sessionStorage.getItem(restoreTargetKey) === route.fullPath

  if (!shouldRestore) return

  const stored = sessionStorage.getItem(scrollStorageKeyFor())

  if (!stored) return

  try {
    const data = JSON.parse(stored) as { top?: unknown, savedAt?: unknown }
    const top = typeof data.top === 'number' ? data.top : null
    const savedAt = typeof data.savedAt === 'number' ? data.savedAt : 0

    if (top === null || Date.now() - savedAt > 30 * 60 * 1000) {
      sessionStorage.removeItem(scrollStorageKeyFor())
      return
    }

    restoredScrollPosition.value = true
    isHistoryNavigation.value = false
    sessionStorage.removeItem(restoreTargetKey)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top,
          behavior: 'instant',
        })
      })
    })
  }
  catch {
    sessionStorage.removeItem(scrollStorageKeyFor())
  }
}

function shouldRestoreScrollForHref(href: string): boolean {
  if (!href.startsWith('/') || href === route.path) return false
  if (!props.restoreScrollLinkPattern) return true

  try {
    return new RegExp(props.restoreScrollLinkPattern).test(href)
  }
  catch {
    return false
  }
}

function handleViewClick(event: MouseEvent) {
  if (!import.meta.client) return

  const target = event.target instanceof Element ? event.target : null
  const link = target?.closest('a[href]')
  const href = link?.getAttribute('href') || ''

  if (!shouldRestoreScrollForHref(href)) return

  saveScrollPosition()
  sessionStorage.setItem(restoreTargetKey, route.fullPath)
}

function scrollToViewTop() {
  if (!import.meta.client) return

  nextTick(() => {
    viewRoot.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

watch(currentPage, (value, oldValue) => {
  if (oldValue === undefined || value === oldValue) return

  scrollToViewTop()
})

watch(
  () => [route.path, route.fullPath] as const,
  ([path], [oldPath, oldFullPath]) => {
    if (!oldPath || path === oldPath) return

    saveScrollPosition(scrollStorageKeyFor(oldFullPath))
    restoredScrollPosition.value = false

    if (
      isHistoryNavigation.value ||
      sessionStorage.getItem(restoreTargetKey) === route.fullPath
    ) {
      nextTick(restoreScrollPosition)
      return
    }

    scrollToViewTop()
  },
)

function markHistoryNavigation() {
  isHistoryNavigation.value = true
}

function handlePageHide() {
  saveScrollPosition()
}

onMounted(() => {
  restoreScrollPosition()
  window.addEventListener('popstate', markHistoryNavigation)
  window.addEventListener('pagehide', handlePageHide)
})

onBeforeUnmount(() => {
  saveScrollPosition()
  window.removeEventListener('popstate', markHistoryNavigation)
  window.removeEventListener('pagehide', handlePageHide)
})
</script>

<template>
  <div ref="viewRoot" class="scroll-mt-24">
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
    :items="getStaticRows()"
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
    v-else-if="hasRows()"
    :classes="rowsWrapper"
    :container="container"
    :grid-items="gridItems"
    :spacing="spacing"
    :width="width"
    @click.capture="handleViewClick"
  >
      <Motion
      v-for="(row, i) in getRenderedRows()"
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
