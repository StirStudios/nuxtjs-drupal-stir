import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import RevealMotion from '../../../layers/theme/app/components/RevealMotion.vue'

describe('RevealMotion (Nuxt runtime)', () => {
  it('forwards motion attributes during server rendering', async () => {
    const html = await renderToString(
      h(
        RevealMotion,
        {
          asChild: true,
          initial: { opacity: 0, y: 100 },
          whileInView: { opacity: 1, y: 0 },
        },
        {
          default: () => h('div', { class: 'reveal-child' }),
        },
      ),
    )

    expect(html).toContain('class="reveal-child"')
    expect(html).toContain('style="opacity:0;transform:translateY(100px);"')
  })
})
