<script lang="ts">
import { domAnimation, LazyMotion, m } from 'motion-v'
import type { Component, PropType } from 'vue'

const MotionElement = m.div as Component

// Props that hide content and play it back in.
const REVEAL_KEYS = ['initial', 'animate', 'whileInView', 'inViewOptions', 'transition'] as const

type AttrRecord = Record<string, unknown>
/**
 * - `inView`: reveals when scrolled to.
 * - `enter`: plays as soon as it is drawn in the browser; server HTML shows
 *   as rendered.
 * - `load`: plays on every load, starting hidden in the server HTML too.
 */
export type RevealPlay = 'inView' | 'enter' | 'load'
// shown: as rendered, no reveal. static: shown, for reduced motion or no
// IntersectionObserver. animate: motion's own initial and reveal.
// remount: animate, after re-mounting server HTML that was below the screen.
type RevealState = 'shown' | 'static' | 'animate' | 'remount'

const withoutRevealKeys = (attrs: AttrRecord): AttrRecord => Object.fromEntries(
  Object.entries(attrs).filter(([key]) => !(REVEAL_KEYS as readonly string[]).includes(key)),
)

const prefersStatic = () =>
  !('IntersectionObserver' in window)
  || window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The one place that decides how a reveal starts, however the page arrived.
// useRevealMotionConfig only describes the animation.
export default defineComponent({
  inheritAttrs: false,
  props: {
    play: { type: String as PropType<RevealPlay>, default: 'inView' },
  },
  setup(props, { attrs, slots }) {
    const motion = ref<{ $el?: Element } | null>(null)
    // Server HTML, and the hydration render that must match it, shows
    // content as rendered (a `load` entrance starts hidden). Content drawn in
    // the browser later starts with motion's own `initial`.
    const fromServer = import.meta.server || useNuxtApp().isHydrating
    const state = ref<RevealState>(
      fromServer
        ? props.play === 'load' ? 'animate' : 'shown'
        : prefersStatic() ? 'static' : 'animate',
    )

    onMounted(() => {
      if (!fromServer) return
      if (prefersStatic()) {
        state.value = 'static'
        return
      }
      if (state.value !== 'shown' || props.play !== 'inView') return

      const element = motion.value?.$el

      // Not an element (nothing to measure): never hide it.
      if (!(element instanceof Element)) return

      const rect = element.getBoundingClientRect()

      // Below the screen: re-mount once, off screen, so motion starts it
      // hidden and reveals it in view, as content drawn in the browser.
      if (rect.top >= window.innerHeight || rect.bottom < 0) state.value = 'remount'
    })

    // Built at render: attrs are not reactive outside it.
    const motionAttrs = (): AttrRecord => {
      const all = attrs as AttrRecord

      if (state.value === 'shown') return { ...withoutRevealKeys(all), initial: false }
      if (state.value === 'static') {
        return {
          ...withoutRevealKeys(all),
          initial: false,
          // A `load` entrance is hidden in the server HTML: settle it at once.
          ...(props.play === 'load'
            ? { animate: all.whileInView ?? all.animate, transition: { duration: 0 } }
            : {}),
        }
      }
      if (props.play === 'inView') return all

      const { whileInView, inViewOptions: _inView, ...rest } = all

      return { ...rest, animate: rest.animate ?? whileInView }
    }

    return () => h(
      LazyMotion,
      { features: domAnimation, strict: true },
      {
        default: () => h(
          MotionElement,
          {
            ...motionAttrs(),
            key: state.value === 'remount' ? 'revealing' : 'rendered',
            ref: motion,
            class: ['reveal-motion', attrs.class],
          },
          slots,
        ),
      },
    )
  },
})
</script>
