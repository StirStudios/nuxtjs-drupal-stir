import { describe, expect, it } from 'vitest'
import {
  isDirectVideoFile,
  resolveHeroVideoSource,
} from '../../layers/theme/app/utils/heroVideoSource'

describe('isDirectVideoFile', () => {
  it('recognizes local and remote video file URLs', () => {
    expect(isDirectVideoFile('/media/example.webm?version=2')).toBe(true)
    expect(isDirectVideoFile('https://video.example/hero.mp4#background')).toBe(true)
  })

  it('does not mistake poster images for playable video', () => {
    expect(isDirectVideoFile('/media/poster.webp')).toBe(false)
    expect(isDirectVideoFile(undefined)).toBe(false)
  })
})

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
