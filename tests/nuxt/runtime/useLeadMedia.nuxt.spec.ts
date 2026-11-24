import type { VNodeArrayChildren } from 'vue'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { useNuxtApp, useState } from '#imports'
import {
  provideLeadMediaSection,
  provideLeadMediaTracker,
  useLeadMedia,
} from '../../../layers/theme/app/composables/useLeadMedia'

const results: Record<string, boolean | undefined> = {}

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

  it('leaves the lead undecided outside a tracked page', async () => {
    await mountSuspended(MediaProbe, { props: { id: 'untracked' } })

    expect(results.untracked).toBeUndefined()
  })
})

describe('useLeadMedia during hydration', () => {
  it('follows the server\'s decision, not the order components hydrate in', async () => {
    const nuxtApp = useNuxtApp()

    // The server chose "page-hero"; in the browser a region's carousel sets up first.
    useState('stir-lead-media').value = { lead: 'page-hero', eager: true }
    nuxtApp.isHydrating = true
    try {
      await mountSuspended(page(() => [h(MediaProbe, { id: 'region-carousel' }), h(Section, () => [h(MediaProbe, { id: 'page-hero' })])]))

      expect(results['region-carousel']).toBe(false)
      expect(results['page-hero']).toBe(true)
    }
    finally {
      nuxtApp.isHydrating = false
      useState('stir-lead-media').value = null
    }
  })
})
