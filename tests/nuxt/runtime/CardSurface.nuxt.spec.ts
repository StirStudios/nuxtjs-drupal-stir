import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeAll, describe, expect, it } from 'vitest'
import { updateAppConfig } from '#imports'
import ParagraphLayout from '../../../layers/theme/app/components/global/Paragraph/Layout.vue'
import ParagraphText from '../../../layers/theme/app/components/global/Paragraph/Text.vue'

// Card surfaces replace the Card and Card style fields; a migrated paragraph
// must render exactly as before.
beforeAll(() => {
  updateAppConfig({
    stirTheme: {
      presentation: {
        surfaces: {
          card: { label: 'Card', class: '', card: true },
          'muted-card': { label: 'Muted card', class: 'bg-muted', card: true },
          'soft-card': { label: 'Soft card', class: '', card: 'soft' },
        },
      },
    },
  })
})

async function html(component: typeof ParagraphLayout | typeof ParagraphText, props: Record<string, unknown>) {
  const wrapper = await mountSuspended(component as typeof ParagraphLayout, {
    props: { id: 'card', ...props } as never,
    slots: { first: '<p>Body</p>' },
  })
  const markup = wrapper.html()

  wrapper.unmount()
  return markup
}

describe('card surfaces', () => {
  it.each([
    { surface: { surface: 'card' }, legacy: { card: true } },
    { surface: { surface: 'muted-card' }, legacy: { card: true, surface: 'muted' } },
  ])('render a Layout like $legacy', async ({ surface, legacy }) => {
    expect(await html(ParagraphLayout, { gridClass: {}, ...surface }))
      .toBe(await html(ParagraphLayout, { gridClass: {}, ...legacy }))
  })

  it.each([
    { surface: { surface: 'card' }, legacy: { card: true } },
    { surface: { surface: 'soft-card' }, legacy: { card: true, cardVariant: 'soft' } },
  ])('render a Text paragraph like $legacy', async ({ surface, legacy }) => {
    expect(await html(ParagraphText, { text: '<p>Body</p>', ...surface }))
      .toBe(await html(ParagraphText, { text: '<p>Body</p>', ...legacy }))
  })

  it('renders no card for an ordinary surface', async () => {
    expect(await html(ParagraphText, { text: '<p>Body</p>', surface: 'card' })).toContain('data-slot="body"')
    expect(await html(ParagraphText, { text: '<p>Body</p>', surface: 'muted' })).not.toContain('data-slot="body"')
  })
})
