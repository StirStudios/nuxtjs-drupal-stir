<script setup lang="ts">
import type { VNode } from 'vue'
import { useIntersectionObserver, usePreferredReducedMotion } from '@vueuse/core'
import {
  resolveCarouselArrowButton,
} from '#stir/utils/nuxtUiProps'
import {
  carouselImageDeliverySizesKey,
  resolveCarouselImageDeliverySizes,
} from '#stir/utils/imageDelivery'

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

  header?: string
  headerTag?: string

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
const carouselRoot = useTemplateRef<HTMLElement>('carouselRoot')

type CarouselController = {
  emblaApi?: {
    plugins: () => {
      autoplay?: {
        play: () => void
        stop: () => void
      }
    }
  }
}

const carousel = useTemplateRef<CarouselController>('carousel')
const preferredMotion = usePreferredReducedMotion()
const carouselIsVisible = ref(false)
const carouselImageDeliverySizes = computed(() =>
  resolveCarouselImageDeliverySizes(
    props.gridItems,
    theme.media.image.profiles.full,
  ),
)

provide(carouselImageDeliverySizesKey, carouselImageDeliverySizes)

onMounted(() => {
  mounted.value = true

  if (!intersectionObserverSupported.value) {
    carouselIsVisible.value = true
    syncAutoplay()
  }
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
  props.carouselAutoscroll && preferredMotion.value !== 'reduce'
    ? {
        speed: autoScrollSpeed.value,
        startDelay: 0,
        stopOnMouseEnter: true,
        stopOnInteraction: false,
      }
    : false,
)

const autoplayOptions = computed(() =>
  !props.carouselAutoscroll && preferredMotion.value !== 'reduce'
    ? {
        delay: interval.value,
        playOnInit: false,
        stopOnMouseEnter: true,
        stopOnInteraction: false,
      }
    : false,
)

const prevButton = computed(() =>
  resolveCarouselArrowButton(theme.carousel.arrows?.prev),
)
const nextButton = computed(() =>
  resolveCarouselArrowButton(theme.carousel.arrows?.next),
)
const carouselLabel = computed(() =>
  `Content carousel ${props.id ?? props.uuid ?? ''}`.trim(),
)

function autoplayPlugin() {
  return carousel.value?.emblaApi?.plugins().autoplay
}

function syncAutoplay() {
  if (
    !mounted.value
    || props.carouselAutoscroll
    || preferredMotion.value === 'reduce'
    || !carouselIsVisible.value
  ) {
    autoplayPlugin()?.stop()
    return
  }

  // The autoplay plugin applies the configured delay before advancing, so
  // starting it when the carousel enters view preserves Drupal's interval for
  // the first transition as well as every later one.
  autoplayPlugin()?.play()
}

const { isSupported: intersectionObserverSupported } = useIntersectionObserver(
  carouselRoot,
  ([entry]) => {
    carouselIsVisible.value = Boolean(entry?.isIntersecting)
    syncAutoplay()
  },
  { threshold: 0.1 },
)

watch([carousel, preferredMotion, interval], syncAutoplay, { flush: 'post' })

function restoreFadeViewportPosition() {
  if (!props.carouselFade) return

  const viewport = carouselRoot.value?.querySelector<HTMLElement>(
    '[data-slot="viewport"]',
  )

  if (!viewport) return

  const resetScrollPosition = () => {
    if (viewport.scrollLeft) {
      viewport.scrollLeft = 0
    }
  }

  resetScrollPosition()
  requestAnimationFrame(resetScrollPosition)
}
</script>

<template>
  <div
    ref="carouselRoot"
    class="relative z-10"
    :class="[theme.carousel.padding, width, spacing]"
    @focusin.capture="restoreFadeViewportPosition"
  >
    <component :is="headerTag || 'h2'" v-if="header">
      {{ header }}
    </component>

    <UCarousel
      v-if="slides.length"
      ref="carousel"
      v-slot="{ item }"
      :aria-label="carouselLabel"
      :arrows="mounted ? carouselArrows : false"
      :auto-height="carouselAutoheight"
      :auto-scroll="autoScrollOptions"
      :autoplay="autoplayOptions"
      :dots="carouselIndicators"
      :fade="carouselFade"
      :items="slides"
      loop
      :next="nextButton"
      :next-icon="theme.carousel.arrows?.nextIcon"
      :prev="prevButton"
      :prev-icon="theme.carousel.arrows?.prevIcon"
      :ui="{
        root: ['stir-carousel', theme.carousel.root],
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

<style>
@media (min-width: 48rem) {
  .stir-carousel:hover [data-slot='prev'],
  .stir-carousel:hover [data-slot='next'],
  .stir-carousel:focus-within [data-slot='prev'],
  .stir-carousel:focus-within [data-slot='next'] {
    opacity: 1;
  }
}
</style>
