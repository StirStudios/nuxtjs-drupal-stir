import { describe, expect, it } from 'vitest'
import { resolveHeroVideoSource } from '../../layers/theme/app/utils/heroVideoSource'

describe('resolveHeroVideoSource', () => {
  it('keeps direct video sources unchanged', () => {
    expect(resolveHeroVideoSource('https://video.example/hero.mp4')).toEqual({
      kind: 'direct',
      src: 'https://video.example/hero.mp4',
    })
  })

  it('turns YouTube embeds into muted looping backgrounds', () => {
    const source = resolveHeroVideoSource('https://www.youtube.com/embed/abcdefghijk?rel=0')
    const url = new URL(source?.src || '')

    expect(source?.kind).toBe('embed')
    expect(url.pathname).toBe('/embed/abcdefghijk')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      autoplay: '1',
      controls: '0',
      loop: '1',
      mute: '1',
      playlist: 'abcdefghijk',
      playsinline: '1',
      rel: '0',
    })
  })

  it('turns Vimeo player embeds into muted looping backgrounds', () => {
    const source = resolveHeroVideoSource('https://player.vimeo.com/video/123456?dnt=1')
    const url = new URL(source?.src || '')

    expect(source?.kind).toBe('embed')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      autoplay: '1',
      background: '1',
      controls: '0',
      dnt: '1',
      loop: '1',
      muted: '1',
    })
  })

  it('returns no source for empty input', () => {
    expect(resolveHeroVideoSource(undefined)).toBeUndefined()
    expect(resolveHeroVideoSource('  ')).toBeUndefined()
  })
})
