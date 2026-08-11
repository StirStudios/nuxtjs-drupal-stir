<script setup lang="ts">
import { cloneVNode, type VNode } from 'vue'
import {
  useIntersectionObserver,
  usePreferredReducedMotion,
  useToggle,
} from '@vueuse/core'
import {
  resolveCarouselArrowButton,
} from '#stir/utils/nuxtUiProps'
import {
  carouselImageDeliverySizesKey,
  carouselNestedImageDeliveryProfileKey,
  resolveCarouselImageDeliverySizes,
} from '#stir/utils/imageDelivery'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import {
  provideRevealMotionScope,
  useRevealMotionScope,
} from '#stir/composables/useRevealMotionScope'

const props = defineProps<{
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
const carouselNestedImageDeliveryProfile = computed(() =>
  carouselImageDeliverySizes.value === theme.media.image.profiles.full
    ? 'card'
    : undefined,
)
const { getRevealDelayMs, revealMotionKey, useRevealMotionProps } =
  useRevealMotionConfig()
const { effect, staggerIndex } = useRevealMotionScope(() => props.direction)
const carouselMotionProps = useRevealMotionProps(
  effect,
  () => getRevealDelayMs(staggerIndex.value),
)

provide(carouselImageDeliverySizesKey, carouselImageDeliverySizes)
provide(
  carouselNestedImageDeliveryProfileKey,
  carouselNestedImageDeliveryProfile,
)
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
    const vnodeProps = typedNode.props as Record<string, unknown> | null
    const isDrupalNode = vnodeProps !== null && 'uid' in vnodeProps
    const renderedVNode =
      isDrupalNode && carouselNestedImageDeliveryProfile.value
        ? cloneVNode(typedNode, {
            imageDeliveryProfile: carouselNestedImageDeliveryProfile.value,
          })
        : typedNode

    return {
      vnode: renderedVNode,
      key: typedNode.key ?? i,
    }
  })
})

const isMarquee = computed(() => props.presentation === 'marquee')
const [marqueePaused, toggleMarqueePaused] = useToggle(false)

const interval = computed(() => props.carouselInterval ?? 5000)
const marqueeDuration = computed(() =>
  `${Math.max(20000, interval.value * Math.max(slides.value.length, 1))}ms`,
)
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
        stopOnMouseEnter: true,
        stopOnInteraction: false,
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
const marqueeRegionId = computed(() =>
  `stir-marquee-${String(props.id ?? props.uuid ?? 'content')}`,
)
const marqueePauseLabel = computed(() =>
  marqueePaused.value ? 'Resume animation' : 'Pause animation',
)

function autoplayPlugin() {
  return carousel.value?.emblaApi?.plugins().autoplay
}

function syncAutoplay() {
  if (
    !mounted.value
    || slides.value.length <= 1
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
    :key="`carousel-${id}-${revealMotionKey}`"
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

      <template v-if="slides.length && isMarquee">
        <div
          v-if="preferredMotion !== 'reduce'"
          class="mb-3 flex justify-end"
        >
          <UButton
            :aria-controls="marqueeRegionId"
            :aria-pressed="marqueePaused"
            color="neutral"
            :icon="marqueePaused ? 'i-lucide-play' : 'i-lucide-pause'"
            :label="marqueePauseLabel"
            size="sm"
            variant="soft"
            @click="toggleMarqueePaused()"
          />
        </div>

        <div
          :id="marqueeRegionId"
          :aria-label="carouselLabel"
          class="stir-marquee overflow-hidden"
          :class="{ 'stir-marquee--paused': marqueePaused }"
          role="region"
          :style="{ '--stir-marquee-duration': marqueeDuration }"
        >
          <!--
            Keep one live Vue tree. Repeated component trees can duplicate
            media requests, analytics, DOM IDs, and keyboard destinations.
          -->
          <div class="stir-marquee__track flex w-max items-center">
            <WrapDiv
              v-for="slide in slides"
              :key="slide.key"
              :styles="gridItems ? ['shrink-0', gridItems] : 'shrink-0'"
            >
              <component :is="slide.vnode" />
            </WrapDiv>
          </div>
        </div>
      </template>

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
        <WrapDiv :styles="gridItems">
          <component :is="item.vnode" :key="item.key" />
        </WrapDiv>
      </UCarousel>
    </div>
  </RevealMotionElement>
</template>

<style>
.stir-marquee__track {
  gap: 2rem;
  padding-inline-end: 2rem;
  animation: stir-marquee var(--stir-marquee-duration, 30s) linear infinite;
}

.stir-marquee--paused .stir-marquee__track,
.stir-marquee:hover .stir-marquee__track,
.stir-marquee:focus-within .stir-marquee__track {
  animation-play-state: paused;
}

@keyframes stir-marquee {
  to {
    transform: translateX(-100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stir-marquee {
    overflow-x: auto;
  }

  .stir-marquee__track {
    animation: none;
  }
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
