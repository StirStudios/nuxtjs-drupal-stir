type AppConfigLike = {
  ui?: {
    colors?: Record<string, unknown>
  }
}

const PALETTE_NAME = /^[a-z][a-z0-9-]*$/

function resolvePalette(value: unknown, fallback: string): string {
  return typeof value === 'string' && PALETTE_NAME.test(value)
    ? value
    : fallback
}

export function buildSpaLoaderThemeStyle(config: AppConfigLike): string {
  const colors = config.ui?.colors || {}
  const primary = resolvePalette(colors.primary, 'green')
  const secondary = resolvePalette(colors.secondary, 'blue')
  const neutral = resolvePalette(colors.neutral, 'slate')

  return [
    '<style id="stir-spa-loader-theme">',
    ':root{',
    `--stir-loader-primary:var(--color-${primary}-500,#64748b);`,
    `--stir-loader-secondary:var(--color-${secondary}-400,#94a3b8);`,
    `--stir-loader-bg:var(--color-${neutral}-50,#f8fafc);`,
    `--stir-loader-text:var(--color-${neutral}-700,#334155);`,
    `--stir-loader-text-toned:var(--color-${neutral}-600,#475569);`,
    `--stir-loader-text-muted:var(--color-${neutral}-500,#64748b);`,
    '}',
    '@media (prefers-color-scheme:dark){:root{',
    `--stir-loader-bg:var(--color-${neutral}-950,#18181b);`,
    `--stir-loader-text:var(--color-${neutral}-100,#f4f4f5);`,
    `--stir-loader-text-toned:var(--color-${neutral}-300,#d4d4d8);`,
    `--stir-loader-text-muted:var(--color-${neutral}-400,#a1a1aa);`,
    '}}',
    '</style>',
  ].join('')
}
