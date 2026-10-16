import type { VNodeArrayChildren } from 'vue'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import {
  provideLeadMediaSection,
  provideLeadMediaTracker,
  useLeadMedia,
} from '../../../layers/theme/app/composables/useLeadMedia'

const results: Record<string, boolean> = {}

const MediaProbe = defineComponent({
  props: { id: { type: String, required: true } },
  setup(props) {
    results[props.id] = useLeadMedia(props.id)

    return () => h('div')
  },
})

const Section = defineComponent({
  setup(_, { slots }) {
    provideLeadMediaSection()

    return () => h('section', slots.default?.())
  },
})

function page(children: () => VNodeArrayChildren) {
  return defineComponent({
    setup() {
      provideLeadMediaTracker()

      return () => h('main', children())
    },
  })
}

describe('useLeadMedia (Nuxt runtime)', () => {
  it('makes only the first media in the first section the lead', async () => {
    await mountSuspended(page(() => [
      h(Section, () => [h(MediaProbe, { id: 'first' }), h(MediaProbe, { id: 'second' })]),
      h(Section, () => [h(MediaProbe, { id: 'lower' })]),
    ]))

    expect(results).toMatchObject({ first: true, second: false, lower: false })
  })

  it('keeps media lazy when the first media sits below the first section', async () => {
    await mountSuspended(page(() => [
      h(Section, () => [h('p', 'Introduction')]),
      h(Section, () => [h(MediaProbe, { id: 'gallery' })]),
      h(Section, () => [h(MediaProbe, { id: 'later' })]),
    ]))

    expect(results).toMatchObject({ gallery: false, later: false })
  })

  it('is never the lead outside a tracked page', async () => {
    await mountSuspended(MediaProbe, { props: { id: 'untracked' } })

    expect(results.untracked).toBe(false)
  })
})
