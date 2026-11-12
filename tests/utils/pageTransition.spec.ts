import { describe, expect, it } from 'vitest'
import { enableViewTransition, pageTransitionViewTransition } from '../../layers/theme/build/pageTransition'
import {
  PAGE_COVER_Z_INDEX,
  pageCoverClipPath,
  pageCrossfadeCss,
} from '../../layers/theme/app/utils/pageTransition'

describe('page transitions', () => {
  it('turns on Nuxt view transitions only for crossfade, never as always', () => {
    expect(pageTransitionViewTransition('crossfade')).toBe(true)
    expect(pageTransitionViewTransition('cover')).toBe(false)
    expect(pageTransitionViewTransition('none')).toBe(false)
    expect(pageTransitionViewTransition(undefined)).toBe(false)
  })

  it('switches on the setting Nuxt\'s plugin reads, not only the experimental flag', () => {
    // As Nuxt leaves them once its config has resolved: transitions off.
    const options = {
      app: { viewTransition: { enabled: false, types: ['slide'] } },
      experimental: { viewTransition: false },
    } as unknown as Parameters<typeof enableViewTransition>[0]

    enableViewTransition(options)
    expect(options.experimental.viewTransition).toBe(true)
    expect(options.app.viewTransition).toEqual({ enabled: true, types: ['slide'] })
  })

  it('keeps the header and admin bar out of the crossfade', () => {
    const css = pageCrossfadeCss(400)

    expect(css).toContain('.stir-header{view-transition-name:site-header}')
    expect(css).toContain('.admin-ui-nav-root{view-transition-name:admin-bar}')
    expect(css).toContain('::view-transition-group(site-header),::view-transition-group(admin-bar){animation:none}')
    expect(css).toContain('animation-duration:400ms')
  })

  it('keeps the cover below the header (z-50) and admin bar (z-60)', () => {
    expect(PAGE_COVER_Z_INDEX).toBeLessThan(50)
  })

  it('draws each cover shape around the origin', () => {
    const origin = { x: '10px', y: '20px' }

    expect(pageCoverClipPath('circle', origin, '0px')).toBe('circle(0px at 10px 20px)')
    expect(pageCoverClipPath('square', origin, '5vmax').match(/calc\(/g)).toHaveLength(8)
    expect(pageCoverClipPath('triangle', origin, '5vmax')).toMatch(
      /^polygon\(calc\(10px \+ 5vmax \* 0\) calc\(20px \+ 5vmax \* -2\), /,
    )
  })
})
