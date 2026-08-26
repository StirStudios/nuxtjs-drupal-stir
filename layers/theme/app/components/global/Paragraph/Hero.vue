<script setup lang="ts">
import { cloneVNode } from 'vue'
import { usePageContext } from '#stir/composables/usePageContext'
import { useNavLockedSnapshot } from '#stir/composables/useNavLockedSnapshot'
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import {
  provideRevealMotionScope,
  useRevealMotionScope,
} from '#stir/composables/useRevealMotionScope'
import { useSlotsToolkit } from '#stir/composables/useSlotsToolkit'
import { resolveBooleanProp } from '#stir/utils/nuxtUiProps'
import { normalizeDrupalMediaType } from '../../../utils/drupalMediaTypes'

const props = defineProps<{
  mode?: 'full' | 'simple'
  text?: string
  editLink?: string
  direction?: string
  siteSlogan?: string
  header?: string
  classes?: string
}>()

defineSlots<{
  header?(): unknown
  media?(): unknown
  footer?(): unknown
  button?(): unknown
  title?(): unknown
}>()

const vueSlots = useSlots()
const tk = useSlotsToolkit(vueSlots)
const { getPage } = useStirDrupalCe()
const page = getPage()
const { isFront } = usePageContext()
const { hero: heroTheme } = useAppConfig().stirTheme
const pageProps = computed(() => page.value?.content?.props || {})
const pageTitle = computed(() => pageProps.value?.title || '')
const pageHideTitle = computed(() => pageProps.value?.hideTitle ?? false)

// Only needed in FULL mode
if (props.mode !== 'simple') {
  provide('isHero', true)
}

const heroSnapshot = useNavLockedSnapshot(computed(() => ({
  hideTitle: pageHideTitle.value,
  isFront: isFront.value,
  title: pageTitle.value,
})))
const isFrontEffective = computed(() => heroSnapshot.value.isFront)
const pageTitleEffective = computed(() => heroSnapshot.value.title)
const pageHideTitleEffective = computed(() => resolveBooleanProp(heroSnapshot.value.hideTitle))

const slotMedia = computed(() => tk.slot('media'))
const heroMediaNode = computed(() => {
  const node = slotMedia.value[0]

  if (!node) return null
  return cloneVNode(node, { isHero: true }, true)
})
const hasMediaSlot = computed(() => Boolean(heroMediaNode.value))
const hasHero = computed(() => !!props.text || hasMediaSlot.value)
const containsVideo = computed(() =>
  slotMedia.value
    .some((node) =>
      normalizeDrupalMediaType(node?.props?.type) === 'video' ||
      node?.props?.mediaEmbed,
    ),
)

const h1Classes = computed(() => {
  const base = hasMediaSlot.value
    ? isFrontEffective.value
      ? heroTheme.text?.isFront
      : heroTheme.text?.heading
    : null

  return [base, pageHideTitleEffective.value && 'sr-only'].filter(Boolean)
})

const heroSubtitle = computed(() => props.header || props.siteSlogan || '')
const hasVisibleDefaultContent = computed(() =>
  Boolean(props.text?.trim()) ||
  Boolean(pageTitleEffective.value && !pageHideTitleEffective.value) ||
  Boolean(
    pageTitleEffective.value &&
    isFrontEffective.value &&
    heroSubtitle.value,
  ),
)
const hasVisibleHeroContent = computed(() =>
  tk.slot('title').length > 0 ||
  tk.slot('button').length > 0 ||
  hasVisibleDefaultContent.value,
)

const sectionClasses = computed(() => {
  if (props.mode === 'simple') {
    return props.classes || ''
  }

  const hasHeroContent = hasHero.value

  return [
    heroTheme.base,

    pageHideTitleEffective.value && !hasHeroContent && !isFrontEffective.value
      ? heroTheme.hide
      : hasMediaSlot.value
        ? heroTheme.mediaSpacing
        : hasHeroContent
          ? [heroTheme.mediaSpacing, heroTheme.noMediaFallback]
          : heroTheme.noMediaSpacing,

    hasMediaSlot.value && heroTheme.overlay,
    isFrontEffective.value && heroTheme.isFront,

    containsVideo.value && 'min-h-[75vh]',
  ]
    .flat()
    .filter(Boolean)
})
const { getRevealDelayMs, useRevealMotionProps } =
  useRevealMotionConfig()
const { effect, isInherited, staggerIndex } =
  useRevealMotionScope(() => props.direction)
const heroMotionProps = useRevealMotionProps(
  () => isInherited.value ? undefined : effect.value,
  () => getRevealDelayMs(staggerIndex.value),
  {
    // Explicit hero motion is an SSR-rendered entrance animation, not a
    // viewport reveal. Inherited page motion continues to skip the hero.
    ssrVisible: false,
    trigger: 'enter',
  },
)

// Page-wide scroll reveals should never hide above-the-fold hero descendants.
// Editors can still animate the hero text by choosing an explicit direction.
provideRevealMotionScope(() => undefined)
</script>

<template>
  <EditLink
    v-slot="{ actions, hasActions, selectAction }"
    controls-placement="slot"
    :link="editLink"
  >
    <template v-if="mode === 'simple'">
      <slot name="header" />
      <slot name="media" />
      <slot name="footer" />

      <LazyEditControls
        v-if="hasActions"
        :actions="actions"
        @select="selectAction"
      />
    </template>

    <template v-else>
      <section class="relative" :class="sectionClasses">
        <RevealMotion
          as-child
          v-bind="heroMotionProps"
        >
          <div
            :class="[
              hasVisibleHeroContent && heroTheme.text.base,
              hasVisibleHeroContent && isFrontEffective && heroTheme.text.isFront,
              'motion-reduce:!opacity-100 motion-reduce:!transform-none',
            ]"
          >
            <slot name="title">
              <HeroContent
                v-if="text"
                :hero-text="text"
                :hide-title="pageHideTitleEffective"
                :is-front="isFrontEffective"
                :page-title="pageTitleEffective"
                :subtitle="heroSubtitle"
              />

              <h1 v-else v-bind="h1Classes.length ? { class: h1Classes } : {}">
                {{ pageTitleEffective }}
              </h1>
            </slot>

            <slot name="button" />
          </div>
        </RevealMotion>

        <component :is="heroMediaNode" />

        <LazyEditControls
          v-if="hasActions"
          :actions="actions"
          @select="selectAction"
        />
      </section>
    </template>
  </EditLink>
</template>
