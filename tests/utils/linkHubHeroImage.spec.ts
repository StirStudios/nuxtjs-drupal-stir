import { describe, expect, it } from 'vitest'
import { resolveLinkHubHeroImage } from '../../layers/theme/app/utils/linkHubHeroImage'

describe('resolveLinkHubHeroImage', () => {
  it('returns the first image authored inside the hero media slot', () => {
    const image = {
      element: 'media-image',
      props: {
        src: '/sites/default/files/hero.jpg',
        width: 1920,
        height: 1080,
      },
    }
    const hero = [{
      element: 'paragraph-hero',
      slots: { media: [image] },
    }]

    expect(resolveLinkHubHeroImage(hero)).toEqual(image.props)
  })

  it('ignores video thumbnails and empty fallback heroes', () => {
    const videoHero = [{
      element: 'paragraph-hero',
      slots: {
        media: [{
          element: 'media-video',
          props: { src: '/sites/default/files/poster.jpg' },
        }],
      },
    }]

    expect(resolveLinkHubHeroImage(videoHero)).toBeNull()
    expect(resolveLinkHubHeroImage([{ element: 'paragraph-hero' }])).toBeNull()
  })

  it('ignores image elements without a usable source', () => {
    expect(resolveLinkHubHeroImage({
      element: 'media-image',
      props: { src: '   ' },
    })).toBeNull()
  })
})
