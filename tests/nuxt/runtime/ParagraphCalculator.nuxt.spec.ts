import { useAppConfig } from '#imports'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ParagraphCalculator from '../../../layers/theme/app/components/global/Paragraph/Calculator.vue'

async function piperOrigin(props: Record<string, string>) {
  const wrapper = await mountSuspended(ParagraphCalculator, { props: { venueId: '42', ...props } })
  const origin = wrapper.find('[data-piper-widget]').attributes('data-piper-origin')

  wrapper.unmount()
  return origin
}

describe('ParagraphCalculator (Nuxt runtime)', () => {
  it('allows no loader hosts by default; a site that embeds it lists them', () => {
    expect(useAppConfig().thirdPartyScripts?.allowedOrigins?.calculator).toEqual([])
  })

  it('leaves the API origin to the widget loader', async () => {
    expect(await piperOrigin({
      embedUrl: 'https://assets.example.com/widgets/loader.js',
    })).toBeUndefined()
  })

  it('passes an explicit API origin through', async () => {
    expect(await piperOrigin({
      embedUrl: 'https://assets.example.com/widgets/loader.js',
      apiOrigin: 'https://app.example.com/',
    })).toBe('https://app.example.com')
  })
})
