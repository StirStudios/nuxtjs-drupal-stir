<script lang="ts">
import { domAnimation, LazyMotion, m } from 'motion-v'
import type { Component } from 'vue'

const MotionElement = m.div as Component

// Props that hide content and play it back in.
const REVEAL_KEYS = ['initial', 'animate', 'whileInView', 'inViewOptions', 'transition'] as const
// The hidden start state the reveal config passes as style after hydration.
const START_STYLE_KEYS = ['opacity', 'transform', 'x', 'y', 'scale', 'rotateX', 'rotateY'] as const

type StyleRecord = Record<string, unknown>

const withoutStartStyle = (style: unknown): StyleRecord => Object.fromEntries(
  Object.entries(typeof style === 'object' && style ? style as StyleRecord : {})
    .filter(([key]) => !(START_STYLE_KEYS as readonly string[]).includes(key)),
)

export default defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const nuxtApp = useNuxtApp()
    const motion = ref<{ $el?: Element } | null>(null)
    // Server-rendered content that is already on screen when the page
    // hydrates has been seen, so it stays as it is: hiding it to play the
    // reveal would make it blink out and fade back in. Content below the
    // screen, or drawn later on the client, reveals as before.
    const hydrating = import.meta.client && nuxtApp.isHydrating
    const seenAtLoad = ref(false)
    // Once a reveal has played, its start state must not come back: a parent
    // re-render (an image arriving, say) would re-apply the style and leave
    // the content faded in but still offset over what follows.
    const settled = ref(false)
    const onAnimationComplete = (...args: unknown[]) => {
      settled.value = true
      ;(attrs.onAnimationComplete as ((...a: unknown[]) => void) | undefined)?.(...args)
    }

    onMounted(() => {
      if (!hydrating) return

      const element = motion.value?.$el

      if (!(element instanceof Element)) return

      const rect = element.getBoundingClientRect()

      seenAtLoad.value = rect.top < window.innerHeight && rect.bottom > 0
    })

    // Built at render: attrs are not reactive outside it.
    const motionAttrs = () => {
      const { style, ...rest } = attrs as StyleRecord & { style?: unknown }

      if (seenAtLoad.value) {
        const kept = Object.fromEntries(Object.entries(rest).filter(([key]) =>
          !(REVEAL_KEYS as readonly string[]).includes(key)))

        return { ...kept, initial: false, style: withoutStartStyle(style) }
      }

      return {
        ...rest,
        onAnimationComplete,
        style: settled.value ? withoutStartStyle(style) : style,
      }
    }

    return () => h(
      LazyMotion,
      { features: domAnimation, strict: true },
      {
        default: () => h(
          MotionElement,
          { ...motionAttrs(), ref: motion, class: ['reveal-motion', attrs.class] },
          slots,
        ),
      },
    )
  },
})
</script>
