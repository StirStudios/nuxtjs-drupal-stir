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
  it('allows Piper loader hosts by pattern by default', () => {
    expect(useAppConfig().thirdPartyScripts?.allowedOrigins?.calculator).toEqual(
      expect.arrayContaining(['https://*.piperavenue.com', 'https://*.stirstudiosdesign.com']),
    )
  })

  it('leaves the API origin to the Piper loader', async () => {
    expect(await piperOrigin({
      embedUrl: 'https://assets.piperavenue.com/widgets/piper-loader.js',
    })).toBeUndefined()
  })

  it('passes an explicit API origin through', async () => {
    expect(await piperOrigin({
      embedUrl: 'https://assets.piperavenue.com/widgets/piper-loader.js',
      apiOrigin: 'https://app.piperavenue.com/',
    })).toBe('https://app.piperavenue.com')
  })
})
