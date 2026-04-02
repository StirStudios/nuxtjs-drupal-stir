<script setup lang="ts">
import type { VNode } from 'vue'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  items?: unknown[]
  randomize?: boolean

  gridItems?: string
  width?: string
  spacing?: string

  carouselIndicators?: boolean
  carouselArrows?: boolean
  carouselFade?: boolean
  carouselAutoscroll?: boolean
  carouselAutoheight?: boolean
  carouselInterval?: number

  editLink?: string
}>()

const theme = useAppConfig().stirTheme
const slots = useSlots()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

const slides = computed(() => {
  const slotItems = slots.media?.() ?? []
  const raw: unknown[] = (props.items?.length ?? 0) > 0 ? (props.items ?? []) : slotItems

  return raw.map((vnode, i) => {
    const typedNode = vnode as VNode

    return {
      vnode: typedNode,
      key: typedNode.key ?? i,
    }
  })
})

const interval = computed(() => props.carouselInterval ?? 5000)
const autoScrollSpeed = computed(() => {
  const minInterval = 1000
  const maxInterval = 10000
  const minSpeed = 1
  const maxSpeed = 10
  const clamped = Math.max(minInterval, Math.min(interval.value, maxInterval))
  const ratio = (maxInterval - clamped) / (maxInterval - minInterval)
  const speed = minSpeed + ratio * (maxSpeed - minSpeed)

  return +speed.toFixed(2)
})

const autoScrollOptions = computed(() =>
  props.carouselAutoscroll
    ? {
        speed: autoScrollSpeed.value,
        startDelay: 0,
        stopOnMouseEnter: true,
        stopOnInteraction: false,
      }
    : false,
)

const autoplayOptions = computed(() =>
  !props.carouselAutoscroll
    ? {
        delay: interval.value,
        stopOnMouseEnter: true,
        stopOnInteraction: false,
      }
    : false,
)
</script>

<template>
  <div class="relative z-10" :class="[theme.carousel.padding, width, spacing]">
    <UCarousel
      v-if="slides.length"
      v-slot="{ item }"
      :arrows="mounted ? carouselArrows : false"
      :auto-height="carouselAutoheight"
      :auto-scroll="autoScrollOptions"
      :autoplay="autoplayOptions"
      :dots="carouselIndicators"
      :fade="carouselFade"
      :items="slides"
      loop
      :next="theme.carousel.arrows?.next"
      :next-icon="theme.carousel.arrows?.nextIcon"
      :prev="theme.carousel.arrows?.prev"
      :prev-icon="theme.carousel.arrows?.prevIcon"
      :ui="{
        root: theme.carousel.root,
        container: 'items-center transition-[height]',
        item: gridItems,
      }"
    >
      <WrapDiv :styles="gridItems">
        <component :is="item.vnode" :key="item.key" />
      </WrapDiv>
    </UCarousel>
  </div>
</template>
