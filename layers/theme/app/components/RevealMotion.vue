<script lang="ts">
import { domAnimation, LazyMotion, m } from 'motion-v'
import type { Component } from 'vue'

const MotionElement = m.div as Component

// Props that hide content and play it back in.
const REVEAL_KEYS = ['initial', 'animate', 'whileInView', 'inViewOptions', 'transition'] as const
// The hidden start state useRevealMotionConfig also passes as style. Motion
// owns the start state through `initial`, so it is never applied as style:
// a style is re-applied on every re-render and would pull revealed content
// back to its start.
const START_STYLE_KEYS = ['opacity', 'transform', 'x', 'y', 'scale', 'rotateX', 'rotateY'] as const

type AttrRecord = Record<string, unknown>

const withoutStartStyle = (style: unknown): AttrRecord => Object.fromEntries(
  Object.entries(typeof style === 'object' && style ? style as AttrRecord : {})
    .filter(([key]) => !(START_STYLE_KEYS as readonly string[]).includes(key)),
)

export default defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const nuxtApp = useNuxtApp()
    const motion = ref<{ $el?: Element } | null>(null)
    // Server-rendered content that is on screen when the page hydrates has
    // been seen, so it stays as it is. Content below the screen re-mounts its
    // motion element once, off screen, so motion starts it hidden through
    // `initial` and reveals it in view, exactly as content drawn in the
    // browser does. Content drawn after hydration needs neither.
    const hydrating = import.meta.client && nuxtApp.isHydrating
    const seenAtLoad = ref(false)
    const remounted = ref(false)

    onMounted(() => {
      if (!hydrating) return

      const element = motion.value?.$el

      if (!(element instanceof Element)) return

      const rect = element.getBoundingClientRect()

      // On screen, or not laid out (nothing to measure): never hide it.
      if (rect.top < window.innerHeight && rect.bottom >= 0) seenAtLoad.value = true
      else remounted.value = true
    })

    // Built at render: attrs are not reactive outside it.
    const motionAttrs = () => {
      const { style, ...rest } = attrs as AttrRecord & { style?: unknown }

      if (seenAtLoad.value) {
        const kept = Object.fromEntries(Object.entries(rest).filter(([key]) =>
          !(REVEAL_KEYS as readonly string[]).includes(key)))

        return { ...kept, initial: false, style: withoutStartStyle(style) }
      }

      return { ...rest, style: withoutStartStyle(style) }
    }

    return () => h(
      LazyMotion,
      { features: domAnimation, strict: true },
      {
        default: () => h(
          MotionElement,
          {
            ...motionAttrs(),
            key: remounted.value ? 'revealing' : 'rendered',
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
