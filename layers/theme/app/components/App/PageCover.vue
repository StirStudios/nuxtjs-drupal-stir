<script setup lang="ts">
// `stirTheme.pageTransition.type: 'cover'`: a panel grows over the page from
// the pointer, the router navigates behind it, and it fades once the new page
// has rendered. Driven by router guards, so links, navigateTo() and
// back/forward all transition without intercepting clicks.
const appConfig = useAppConfig()
const nuxtApp = useNuxtApp()
const router = useRouter()

const panel = ref<HTMLElement | null>(null)
const stage = ref<'cover' | 'reveal' | null>(null)
const origin = ref(PAGE_COVER_DEFAULTS.origin)

const cover = computed(() => ({
  ...PAGE_COVER_DEFAULTS,
  ...appConfig.stirTheme.pageTransition?.cover,
}))
const surface = computed(() => {
  const name = cover.value.surface?.component

  return name ? nuxtApp.vueApp.component(name) : undefined
})
const startClip = computed(() => pageCoverClipPath(cover.value.shape, origin.value, '0px'))
const endClip = computed(() =>
  pageCoverClipPath(cover.value.shape, origin.value, PAGE_COVER_DEFAULTS.radius),
)

let lastPointer: { x: number, y: number, at: number } | null = null
let revealTimer: ReturnType<typeof setTimeout> | undefined
let previousOverflow: [string, string] | null = null
const cleanups: Array<() => void> = []

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function animate(keyframes: Keyframe[], duration: number) {
  const [x1, y1, x2, y2] = cover.value.ease

  panel.value?.animate?.(keyframes, {
    duration,
    easing: `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
    fill: 'forwards',
  })

  return wait(duration)
}

function takePointerOrigin() {
  const pointer = lastPointer

  lastPointer = null

  // A pointer only explains a navigation that follows it closely.
  return pointer && performance.now() - pointer.at < 1500
    ? { x: `${pointer.x}px`, y: `${pointer.y}px` }
    : PAGE_COVER_DEFAULTS.origin
}

async function reveal() {
  if (stage.value !== 'cover') return

  clearTimeout(revealTimer)
  stage.value = 'reveal'
  await animate([{ opacity: 1 }, { opacity: 0 }], cover.value.revealDurationMs)
  stage.value = null
}

function lockScroll(locked: boolean) {
  const html = document.documentElement

  html.toggleAttribute('data-page-transition', locked)

  if (locked && !previousOverflow) {
    previousOverflow = [html.style.overflow, document.body.style.overflow]
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  } else if (!locked && previousOverflow) {
    [html.style.overflow, document.body.style.overflow] = previousOverflow
    previousOverflow = null
  }
}

watch(stage, value => lockScroll(Boolean(value)))

onMounted(() => {
  const onPointerDown = (event: PointerEvent) => {
    lastPointer = { x: event.clientX, y: event.clientY, at: performance.now() }
  }

  document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
  cleanups.push(
    () => document.removeEventListener('pointerdown', onPointerDown, { capture: true }),
    router.beforeEach(async (to, from) => {
      // Query and hash changes (filters, anchors) stay on the page.
      if (to.path === from.path || stage.value) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      origin.value = takePointerOrigin()
      stage.value = 'cover'
      await nextTick()
      await animate(
        [{ clipPath: startClip.value }, { clipPath: endClip.value }],
        cover.value.coverDurationMs,
      )
      // Never leave the page covered if it does not finish.
      revealTimer = setTimeout(reveal, 6000)
    }),
    router.afterEach((_to, _from, failure) => {
      if (failure) void reveal()
    }),
    router.onError(() => void reveal()),
    nuxtApp.hook('page:finish', () => void reveal()),
  )
})

onBeforeUnmount(() => {
  cleanups.forEach(cleanup => cleanup())
  clearTimeout(revealTimer)
  lockScroll(false)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="stage"
      ref="panel"
      aria-hidden="true"
      class="stir-page-cover pointer-events-none fixed inset-0"
      :data-shape="cover.shape"
      :style="{
        zIndex: PAGE_COVER_Z_INDEX,
        backgroundColor: cover.color,
        clipPath: stage === 'cover' ? startClip : endClip,
      }"
    >
      <component
        :is="surface"
        v-if="surface"
        v-bind="cover.surface?.props"
        class="absolute inset-0"
        :class="cover.surface?.class"
      />
      <UIcon
        v-if="cover.icon"
        class="absolute top-1/2 left-1/2 size-16 -translate-1/2"
        :class="cover.iconClass"
        :name="cover.icon"
      />
    </div>
  </Teleport>
</template>
