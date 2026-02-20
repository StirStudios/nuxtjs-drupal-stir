<script setup lang="ts">
import { usePageContext } from '~/composables/usePageContext'
import { useIntersectionObserver } from '~/composables/useIntersectionObserver'
import { useSlotsToolkit } from '~/composables/useSlotsToolkit'
import { useNavLock } from '~/composables/useNavLock'

const props = defineProps<{
  mode?: 'full' | 'simple'
  text?: string
  editLink?: string
  direction?: string
  siteSlogan?: string
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
const { observeVideos } = useIntersectionObserver()
const { isFront, pageTitle, pageHide } = usePageContext()
const { locked } = useNavLock()
const { hero: heroTheme } = useAppConfig().stirTheme

// Only needed in FULL mode
if (props.mode !== 'simple') {
  onMounted(() => observeVideos(0.1))
  provide('isHero', true)
}

// Snapshot anti-flicker system
const snap = reactive({
  isFront: isFront.value,
  title: pageTitle.value,
})

watch(locked, (l) => {
  if (!l) {
    snap.isFront = isFront.value
    snap.title = pageTitle.value
  }
})

const isFrontEffective = computed(() =>
  locked.value ? snap.isFront : isFront.value,
)

const pageTitleEffective = computed(() =>
  locked.value ? snap.title : pageTitle.value,
)

const hideHeroSection = computed(
  () => props.mode !== 'simple' && pageHide.value && !isFrontEffective.value,
)

const slotMedia = computed(() => tk.slot('media'))
const hasMediaSlot = computed(() => slotMedia.value.length > 0)
const hasHero = computed(() => !!props.text || hasMediaSlot.value)
const containsVideo = computed(() =>
  slotMedia.value
    .some((node) => node?.props?.type === 'video' || node?.props?.mediaEmbed),
)

const h1Classes = computed(() => {
  const base = hasMediaSlot.value
    ? isFrontEffective.value
      ? heroTheme.text?.isFront
      : heroTheme.text?.h1
    : null

  return [base].filter(Boolean)
})

const sectionClasses = computed(() => {
  if (props.mode === 'simple') {
    return props.classes || ''
  }

  const hasHeroContent = hasHero.value

  return [
    heroTheme.base,

    hideHeroSection.value
      ? `${heroTheme.hide} sr-hide`
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
</script>

<template>
  <EditLink :link="editLink">
    <template v-if="mode === 'simple'">
      <slot name="header" />
      <slot name="media" />
      <slot name="footer" />
    </template>

    <template v-else>
      <section :class="sectionClasses">
        <div
          :class="[
            heroTheme.text.base,
            isFrontEffective && heroTheme.text.isFront,
          ]"
        >
          <WrapAnimate :effect="direction">
            <slot name="title">
              <HeroContent
                v-if="text"
                :hero-text="text"
                :is-front="isFrontEffective"
                :page-title="pageTitleEffective"
                :site-slogan="siteSlogan"
              />

              <h1 v-else v-bind="h1Classes.length ? { class: h1Classes } : {}">
                {{ pageTitleEffective }}
              </h1>
            </slot>

            <slot name="button" />
          </WrapAnimate>
        </div>

        <slot name="media" />
      </section>
    </template>
  </EditLink>
</template>
