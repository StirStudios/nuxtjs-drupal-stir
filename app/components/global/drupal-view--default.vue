<script setup lang="ts">
import { cloneVNode } from 'vue'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'

const props = defineProps<{
  title?: string
  gridItems?: string
  width?: string
  spacing?: string
  rowsWrapper?: unknown
  container?: boolean

  viewId?: string
  displayId?: string
  parentUuid?: string
  direction?: string

  pager?: { current: number; totalPages: number } | unknown

  randomize?: boolean | string
  carousel?: boolean
  carouselArrows?: boolean
  carouselAutoheight?: boolean
  carouselAutoscroll?: boolean
  carouselFade?: boolean
  carouselIndicators?: boolean
  carouselInterval?: number

  exposedFilters?: unknown[]
  exposedSorts?: unknown[]
}>()

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const randomizeEnabled = computed(() => {
  if (props.randomize === true) return true
  if (typeof props.randomize === 'string') {
    const value = props.randomize.trim().toLowerCase()

    return value === 'true' || value === '1'
  }

  return false
})
const rawRows = computed(() => tk.slot('rows'))
const slotRows = tk.hydrateOrder(
  () => rawRows.value,
  () =>
    (randomizeEnabled.value ? tk.shuffle(rawRows.value) : rawRows.value).map(
      (vnode, index) => {
        return {
          ...vnode,
          key: vnode.key ?? `slide-${index}`,
        }
      },
    ),
)

const teaserRows = computed(() =>
  slotRows.value.map((node) =>
    cloneVNode(
      node,
      {
        type: 'teaser',
      },
      true,
    ),
  ),
)
</script>

<template>
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
    v-else
    :container="container"
    :grid-items="gridItems"
    :spacing="spacing"
    :width="width"
  >
    <template v-for="(node, i) in teaserRows" :key="i">
      <div class="item">
        <component :is="node" />
      </div>
    </template>
  </WrapGrid>

  <DrupalViewsPagination
    v-if="pager && !carousel && pager.totalPages > 1"
    class="mt-8"
    :current="pager.current"
    :total-pages="pager.totalPages"
  />
</template>
