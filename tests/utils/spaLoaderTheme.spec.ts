import { describe, expect, it } from 'vitest'
import { buildSpaLoaderThemeStyle } from '../../layers/theme/build/spaLoaderTheme'

describe('SPA loader theme', () => {
  it('uses the configured Nuxt UI palettes before the app mounts', () => {
    const style = buildSpaLoaderThemeStyle({
      ui: {
        colors: {
          primary: 'red',
          secondary: 'amber',
          neutral: 'zinc',
        },
      },
    })

    expect(style).toContain('--stir-loader-primary:var(--color-red-500')
    expect(style).toContain('--stir-loader-secondary:var(--color-amber-400')
    expect(style).toContain('--stir-loader-bg:var(--color-zinc-50')
    expect(style).toContain('--stir-loader-bg:var(--color-zinc-950')
  })

  it('rejects unsafe palette names and uses stable defaults', () => {
    const style = buildSpaLoaderThemeStyle({
      ui: {
        colors: {
          primary: 'red;}body{display:none',
          secondary: '',
          neutral: 42,
        },
      },
    })

    expect(style).toContain('--stir-loader-primary:var(--color-green-500')
    expect(style).toContain('--stir-loader-secondary:var(--color-blue-400')
    expect(style).toContain('--stir-loader-bg:var(--color-slate-50')
    expect(style).not.toContain('display:none')
  })
})
