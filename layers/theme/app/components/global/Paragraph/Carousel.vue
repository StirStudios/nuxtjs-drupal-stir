<script setup lang="ts">
import type { VNode } from 'vue'
import {
  useIntersectionObserver,
  usePreferredReducedMotion,
} from '@vueuse/core'
import {
  resolveCarouselArrowButton,
} from '#stir/utils/nuxtUiProps'
import {
  carouselImageDeliverySizesKey,
  resolveCarouselImageDeliverySizes,
} from '#stir/utils/imageDelivery'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import {
  provideRevealMotionScope,
  useRevealMotionScope,
} from '#stir/composables/useRevealMotionScope'

const props = withDefaults(defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  items?: unknown[]
  presentation?: 'carousel' | 'marquee' | string
  randomize?: boolean

  gridItems?: string
  width?: string
  spacing?: string

  header?: string
  headerTag?: string
  direction?: string

  carouselIndicators?: boolean
  carouselArrows?: boolean
  carouselFade?: boolean
  carouselAutoscroll?: boolean
  carouselAutoheight?: boolean
  carouselInterval?: number

  marqueeDuration?: number
  marqueeOrientation?: 'horizontal' | 'vertical'
  marqueeOverlay?: boolean
  marqueePauseOnHover?: boolean
  marqueeReverse?: boolean

  editLink?: string
}>(), {
  carouselInterval: undefined,
  direction: undefined,
  editLink: undefined,
  gridItems: undefined,
  header: undefined,
  headerTag: undefined,
  id: undefined,
  items: undefined,
  marqueeDuration: undefined,
  marqueeOrientation: undefined,
  marqueePauseOnHover: true,
  parentUuid: undefined,
  presentation: undefined,
  region: undefined,
  spacing: undefined,
  uuid: undefined,
  width: undefined,
})

const theme = useAppConfig().stirTheme
const slots = useSlots()
const mounted = ref(false)
const carouselRoot = useTemplateRef<HTMLElement>('carouselRoot')

type MotionController = { play: () => void, stop: () => void }

type CarouselController = {
  emblaApi?: {
    plugins: () => {
      autoplay?: MotionController
      autoScroll?: MotionController
    }
  }
}

const carousel = useTemplateRef<CarouselController>('carousel')
const preferredMotion = usePreferredReducedMotion()
const carouselIsVisible = ref(false)
const userPaused = ref(false)
const hovered = ref(false)
const contentId = useId()
const motionPaused = computed(() => userPaused.value || hovered.value
  || preferredMotion.value === 'reduce' || !carouselIsVisible.value)
const carouselImageDeliverySizes = computed(() =>
  resolveCarouselImageDeliverySizes(
    props.gridItems,
    theme.media.image.profiles.full,
  ),
)
const { getRevealDelayMs, revealMotionKey, useRevealMotionProps } =
  useRevealMotionConfig()
const { effect, staggerIndex } = useRevealMotionScope(() => props.direction)
const carouselMotionProps = useRevealMotionProps(
  effect,
  () => getRevealDelayMs(staggerIndex.value),
)

provide(carouselImageDeliverySizesKey, carouselImageDeliverySizes)
// The carousel enters as one unit; its media slides should not double animate.
provideRevealMotionScope(() => undefined)

onMounted(() => {
  mounted.value = true

  if (!intersectionObserverSupported.value) {
    carouselIsVisible.value = true
    syncAutoplay()
  }
})

const slides = computed(() => {
  const orderedItems = slots.items?.() ?? []
  const slotItems = orderedItems.length ? orderedItems : (slots.media?.() ?? [])
  const raw: unknown[] = (props.items?.length ?? 0) > 0 ? (props.items ?? []) : slotItems

  return raw.map((vnode, i) => {
    const typedNode = vnode as VNode

    return {
      vnode: typedNode,
      key: typedNode.key ?? i,
    }
  })
})

const isMarquee = computed(() => props.presentation === 'marquee')
const marqueeStyle = computed(() => props.marqueeDuration
  ? { '--duration': `${Math.max(1, props.marqueeDuration)}s` }
  : undefined)

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
  slides.value.length > 1
  && props.carouselAutoscroll
  && preferredMotion.value !== 'reduce'
    ? {
        speed: autoScrollSpeed.value,
        startDelay: 0,
        playOnInit: false,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
        stopOnInteraction: true,
      }
    : false,
)

const autoplayOptions = computed(() =>
  slides.value.length > 1
  && !props.carouselAutoscroll
  && preferredMotion.value !== 'reduce'
    ? {
        delay: interval.value,
        playOnInit: false,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
        stopOnInteraction: true,
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
const marqueeLabel = computed(() =>
  `Content marquee ${props.id ?? props.uuid ?? ''}`.trim(),
)

function syncAutoplay() {
  const plugins = carousel.value?.emblaApi?.plugins()
  const activePlugin = props.carouselAutoscroll ? plugins?.autoScroll : plugins?.autoplay

  if (!mounted.value || slides.value.length <= 1 || motionPaused.value) {
    activePlugin?.stop()
  } else {
    activePlugin?.play()
  }
}

const { isSupported: intersectionObserverSupported } = useIntersectionObserver(
  carouselRoot,
  ([entry]) => {
    carouselIsVisible.value = Boolean(entry?.isIntersecting)
    syncAutoplay()
  },
  { threshold: 0.1 },
)

watch([carousel, motionPaused, interval, () => props.carouselAutoscroll], syncAutoplay, { flush: 'post' })

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

function releasePointerArrowFocus(event: PointerEvent) {
  const target = event.target

  if (!(target instanceof Element)) return

  target
    .closest<HTMLElement>('[data-slot="prev"], [data-slot="next"]')
    ?.blur()
}
</script>

<template>
  <RevealMotionElement
    :key="`carousel-${id}-${'whileInView' in carouselMotionProps ? revealMotionKey : 0}`"
    class="relative z-10"
    :class="[theme.carousel.padding, width, spacing]"
    :motion-props="carouselMotionProps"
    @focusin.capture="restoreFadeViewportPosition"
    @pointerup.capture="releasePointerArrowFocus"
  >
    <div ref="carouselRoot">
      <component :is="headerTag || 'h2'" v-if="header">
        {{ header }}
      </component>

      <UButton
        v-if="slides.length > 1 && preferredMotion !== 'reduce'"
        :aria-controls="mounted ? contentId : undefined"
        class="sr-only focus:not-sr-only focus:absolute focus:z-20"
        color="neutral"
        :disabled="!mounted"
        :icon="userPaused ? 'i-lucide-play' : 'i-lucide-pause'"
        :label="userPaused ? 'Start automatic scrolling' : 'Pause automatic scrolling'"
        variant="outline"
        @click="userPaused = !userPaused"
      />

      <div
        :id="contentId"
        @focusin="userPaused = true"
        @mouseenter="hovered = !isMarquee || marqueePauseOnHover"
        @mouseleave="hovered = false"
        @pointerdown="userPaused = true"
      >
        <UMarquee
          v-if="isMarquee && slides.length"
          :aria-label="marqueeLabel"
          class="stir-marquee"
          :class="{ 'stir-marquee-paused': motionPaused }"
          :orientation="marqueeOrientation ?? 'horizontal'"
          :overlay="marqueeOverlay ?? false"
          :pause-on-hover="marqueePauseOnHover"
          :repeat="theme.carousel.marqueeRepeat[marqueeOrientation ?? 'horizontal']"
          :reverse="marqueeReverse ?? false"
          :style="marqueeStyle"
        >
          <div v-for="item in slides" :key="item.key">
            <component :is="item.vnode" />
          </div>
        </UMarquee>

        <UCarousel
          v-else-if="slides.length"
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
          <component :is="item.vnode" :key="item.key" />
        </UCarousel>
      </div>
    </div>
  </RevealMotionElement>
</template>

<style>
.stir-marquee-paused [data-slot='content'] {
  animation-play-state: paused !important;
}

@media (min-width: 48rem) {
  .stir-carousel:hover [data-slot='prev'],
  .stir-carousel:hover [data-slot='next'],
  .stir-carousel:has(:focus-visible) [data-slot='prev'],
  .stir-carousel:has(:focus-visible) [data-slot='next'] {
    opacity: 1;
  }
}
</style>
