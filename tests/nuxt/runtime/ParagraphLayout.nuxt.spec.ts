import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, inject } from 'vue'
import ParagraphLayout from '../../../layers/theme/app/components/global/Paragraph/Layout.vue'
import {
  provideRevealMotionScope,
  useRevealMotionScope,
} from '../../../layers/theme/app/composables/useRevealMotionScope'
import { layoutImageDeliveryProfileKey } from '../../../layers/theme/app/utils/imageDelivery'

const RevealScopeProbe = defineComponent({
  setup() {
    const { inheritedStagger, staggerIndex } =
      useRevealMotionScope(() => undefined)

    return () => h('span', {
      class: 'reveal-scope-probe',
      'data-stagger': String(inheritedStagger.value),
      'data-stagger-index': String(staggerIndex.value),
    })
  },
})

const ImageDeliveryProfileProbe = defineComponent({
  setup() {
    const profile = inject(layoutImageDeliveryProfileKey)

    return () => h('span', {
      class: 'image-delivery-profile-probe',
      'data-profile': profile?.value,
    })
  },
})

describe('ParagraphLayout (Nuxt runtime)', () => {
  it.each([
    { layoutTag: 'section', header: '', tag: 'SECTION' },
    { layoutTag: 'div', header: 'Child heading', tag: 'DIV' },
    { layoutTag: undefined, header: '', tag: 'SECTION' },
    { layoutTag: 'script', header: '', tag: 'SECTION' },
  ])('uses $tag for a layout with heading "$header"', async ({ layoutTag, header, tag }) => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: { id: 'semantics', layoutTag, header, surface: 'muted', gridClass: {} },
      slots: { first: '<h3>Independent child heading</h3>' },
    })

    expect(wrapper.get('#section-semantics').element.tagName).toBe(tag)
    expect(wrapper.get('#section-semantics').classes()).toContain('bg-muted')
    expect(wrapper.find('h2').exists()).toBe(Boolean(header))
    expect(wrapper.get('h3').text()).toBe('Independent child heading')
    wrapper.unmount()
  })

  it.each([
    { choice: { surface: 'muted' }, classes: ['bg-muted'] },
    { choice: { presentationVariant: 'action-group' }, classes: ['action-group'] },
    { choice: { presentationVariant: 'action-group-center' }, classes: ['action-group', 'action-group--center'] },
    { choice: { presentationVariant: 'action-group-right' }, classes: ['action-group', 'action-group--right'] },
    { choice: { surface: 'inverted', presentationVariant: 'action-group' }, classes: ['bg-inverted', 'text-inverted', 'action-group'] },
  ])('renders $choice with its catalogue classes', async ({ choice, classes }) => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: { id: 'presentation', gridClass: {}, ...choice },
      slots: { first: '<p>First</p>', second: '<p>Second</p>' },
    })

    for (const name of classes) expect(wrapper.find(`.${name}`).exists(), name).toBe(true)
    wrapper.unmount()
  })

  it('applies no presentation classes without a known choice, even from a payload classes value', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: { id: 'unknown', gridClass: {}, surface: 'unknown' },
      attrs: { classes: 'showcase-row' },
      slots: { first: '<p>First</p>' },
    })

    expect(wrapper.find('.showcase-row').exists()).toBe(false)
    expect(wrapper.get('#section-unknown').classes()).not.toContain('bg-muted')
    wrapper.unmount()
  })

  it('allows headed subsections inside a headed layout', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: { id: 'outer', header: 'Collection' },
      slots: { first: () => h(ParagraphLayout, { id: 'inner', layoutTag: 'section', header: 'Part one', headerTag: 'h3' }) },
    })

    expect(wrapper.get('section#section-outer section#section-inner h3').text()).toBe('Part one')
    wrapper.unmount()
  })

  it('renders repeatable grid items directly for grid layouts', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'grid',
        layout: 'grid',
        gridClass: { columns: { md: 2 }, gap: { default: 4 } },
      },
      slots: {
        items: `
          <article class="grid-item">One</article>
          <article class="grid-item">Two</article>
        `,
      },
    })

    const gridItems = wrapper.findAll('.grid-item')

    expect(wrapper.find('.md\\:grid-cols-2').exists()).toBe(true)
    expect(gridItems).toHaveLength(2)
    expect(wrapper.find('.region.items').exists()).toBe(false)
  })

  it('renders direct producer named regions recursively', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'default',
        layout: 'two_column',
      },
      slots: {
        first: '<article class="first-item">First</article>',
        second: () => h(ParagraphLayout, {
          id: 'nested',
          layout: 'one_column',
        }, {
          first: () => h('article', { class: 'nested-item' }, 'Nested'),
        }),
      },
    })

    expect(wrapper.find('.region.first > .first-item').exists()).toBe(true)
    expect(wrapper.find('.region.second .region.first > .nested-item').exists()).toBe(true)
  })

  it.each([
    { container: true, expected: 'split' },
    { container: false, expected: 'splitFull' },
  ])('provides $expected image delivery for container=$container', async ({
    container,
    expected,
  }) => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: `delivery-${expected}`,
        layout: 'two_column',
        container,
      },
      slots: {
        first: () => h(ImageDeliveryProfileProbe),
      },
    })

    expect(wrapper.find('.image-delivery-profile-probe').attributes('data-profile'))
      .toBe(expected)
  })

  it('keeps multiple components in an aligned region stacked vertically', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'aligned-region',
        layout: 'two_column',
        regionAlign: {
          second: { justify: 'center', text: 'center' },
        },
      },
      slots: {
        first: '<img class="contact-image" alt="" />',
        second: `
          <div class="contact-copy">Contact copy</div>
          <form class="contact-form">Contact form</form>
        `,
      },
    })

    expect(wrapper.find('.region.second').classes()).toEqual(
      expect.arrayContaining(['flex-col', 'md:flex', 'justify-center', 'text-center']),
    )
    expect(wrapper.find('.region.second > .contact-copy').exists()).toBe(true)
    expect(wrapper.find('.region.second > .contact-form').exists()).toBe(true)
  })

  it('can show the second region first only while a two-column layout is stacked', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'reversed',
        layout: 'two_column_8_4',
        reverseMobile: true,
      },
      slots: {
        first: '<article>Form</article>',
        second: '<aside>Contact details</aside>',
      },
    })

    expect(wrapper.find('.region.first').classes()).toEqual(
      expect.arrayContaining(['order-2', 'lg:order-none']),
    )
    expect(wrapper.find('.region.second').classes()).toEqual(
      expect.arrayContaining(['order-1', 'lg:order-none']),
    )
  })

  it('ignores reversed mobile stacking for layouts with more than two columns', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'four-column',
        layout: 'four_column',
        reverseMobile: true,
      },
      slots: {
        first: '<article>One</article>',
        second: '<article>Two</article>',
      },
    })

    expect(wrapper.find('.region.first').classes()).not.toContain('order-2')
    expect(wrapper.find('.region.second').classes()).not.toContain('order-1')
  })

  it('registers the heading before animated layout children', async () => {
    const wrapper = await mountSuspended(ParagraphLayout, {
      props: {
        id: 'heading-order',
        header: 'Heading first',
        animationStagger: true,
      },
      slots: {
        first: () => h(RevealScopeProbe),
      },
    })

    const probe = wrapper.find('.reveal-scope-probe')

    expect(probe.attributes('data-stagger')).toBe('true')
    expect(Number(probe.attributes('data-stagger-index'))).toBeGreaterThan(0)
  })

  it('carries page stagger into layout children', async () => {
    const PageScope = defineComponent({
      setup() {
        provideRevealMotionScope(() => 'fade-up', { stagger: true })

        return () => h(ParagraphLayout, {
          id: 'page-stagger',
          header: 'Heading first',
        }, {
          first: () => h(RevealScopeProbe),
        })
      },
    })
    const wrapper = await mountSuspended(PageScope)
    const probe = wrapper.find('.reveal-scope-probe')

    expect(probe.attributes('data-stagger')).toBe('true')
    expect(Number(probe.attributes('data-stagger-index'))).toBeGreaterThan(0)
  })
})
