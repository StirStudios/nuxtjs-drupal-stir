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
  it.each([
    { choice: { surface: 'muted' }, classes: ['bg-muted'] },
    { choice: { surface: 'inverted', presentationVariant: 'action-group' }, classes: ['bg-inverted', 'text-inverted', 'action-group'] },
  ])('renders $choice with its catalogue classes', async ({ choice, classes }) => {
    const html = await render(choice)

    for (const name of classes) expect(html, name).toMatch(new RegExp(`class="[^"]*\\b${name}\\b`, 'u'))
  })

  it('ignores a payload classes value', async () => {
    expect(await render({ classes: 'showcase-copy', surface: 'unknown' })).not.toContain('showcase-copy')
    expect(await render({ classes: 'showcase-copy' })).toBe(await render({}))
  })
})
