import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ParagraphText from '../../../layers/theme/app/components/global/Paragraph/Text.vue'

const render = async (props: Record<string, unknown>) => {
  const wrapper = await mountSuspended(ParagraphText, {
    props: { id: 'presentation', text: '<p>Body</p>', ...props },
  })
  const html = wrapper.html()

  wrapper.unmount()
  return html
}

describe('ParagraphText presentation choices', () => {
  // Content migrated from free-text classes must render exactly as before.
  it.each([
    { choice: { surface: 'muted' }, legacy: 'bg-muted' },
    { choice: { surface: 'inverted', presentationVariant: 'action-group' }, legacy: 'bg-inverted text-inverted action-group' },
  ])('renders $choice exactly like the classes "$legacy"', async ({ choice, legacy }) => {
    expect(await render(choice)).toBe(await render({ classes: legacy }))
  })

  it('keeps the free-text classes when no known choice is set', async () => {
    expect(await render({ classes: 'showcase-copy', surface: 'unknown' }))
      .toBe(await render({ classes: 'showcase-copy' }))
    expect(await render({ classes: 'showcase-copy' })).toContain('showcase-copy')
  })
})
