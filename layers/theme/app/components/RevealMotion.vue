<script lang="ts">
import { domAnimation, LazyMotion, m } from 'motion-v'
import type { Component } from 'vue'

const MotionElement = m.div as Component

// Props that hide content and play it back in.
const REVEAL_KEYS = ['initial', 'animate', 'whileInView', 'inViewOptions', 'transition'] as const

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

    onMounted(() => {
      if (!hydrating) return

      const element = motion.value?.$el

      if (!(element instanceof Element)) return

      const rect = element.getBoundingClientRect()

      seenAtLoad.value = rect.top < window.innerHeight && rect.bottom > 0
    })

    // Built at render: attrs are not reactive outside it.
    const motionAttrs = () => {
      if (!seenAtLoad.value) return attrs

      const { style, ...rest } = attrs as Record<string, unknown> & { style?: Record<string, unknown> }
      const kept = Object.fromEntries(Object.entries(rest).filter(([key]) =>
        !(REVEAL_KEYS as readonly string[]).includes(key)))
      const { opacity: _opacity, transform: _transform, ...keptStyle } = typeof style === 'object' && style ? style : {}

      // Media hides itself in the server HTML with motion-safe:opacity-0 and
      // relies on the reveal to show it, so show it here explicitly.
      return { ...kept, initial: false, style: { ...keptStyle, opacity: 1 } }
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
