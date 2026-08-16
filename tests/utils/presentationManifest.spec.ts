import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  buildPresentationSource,
  inlinePresentationSource,
  loadPresentationManifest,
  parsePresentationManifest,
  presentationUtilities,
  resolvePresentationManifestSource,
} from '../../layers/theme/build/presentationManifest'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function fixture() {
  const payload = {
    schemaVersion: 2 as const,
    site: { uuid: 'site-uuid', name: 'Example', theme: 'stir' },
    capabilities: ['layout', 'semantic-presentation'],
    used: {
      grid: {
        columns: { default: [2], lg: [3] },
        gap: { default: [4], lg: [6] },
        matrix: false,
      },
      spacing: ['py-20'],
      width: ['w-md'],
      alignment: ['justify_center', 'text_left'],
    },
    legacyClasses: [
      'mt-0',
      'mt-8',
      'grid-cols-[minmax(0,1fr)_2fr]',
      'text-[#123456]',
      'border-white/10',
      'custom-project-class',
      'group-hover/item:block',
      'lg:text-left',
      'md:gap-4',
      'peer-checked/field:block',
      '@container',
      '[&_[data-active]]:block',
      'max-w-none!',
      'xl:px-[calc((100vw-72rem)/2+1.5rem)]',
    ],
    diagnostics: { rejectedLegacyClassCount: 0 },
  }

  return {
    ...payload,
    revision: createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex'),
  }
}

describe('CMS presentation manifest', () => {
  it('uses the packaged fixture only when explicitly requested downstream', () => {
    const fixturePath = '/layer/contracts/presentation-usage-manifest.json'

    expect(resolvePresentationManifestSource({
      useFixture: true,
      fixturePath,
      drupalUrl: 'https://cms.example.com',
    })).toBe(fixturePath)
    expect(resolvePresentationManifestSource({
      fixturePath,
      drupalUrl: 'https://cms.example.com/',
    })).toBe('https://cms.example.com/ce-api/stir-layout-builder/presentation-manifest')
    expect(resolvePresentationManifestSource({
      source: '/project/manifest.json',
      useFixture: true,
      fixturePath,
    })).toBe('/project/manifest.json')
  })

  it('validates schema and deterministic revision', () => {
    expect(parsePresentationManifest(fixture()).schemaVersion).toBe(2)
    expect(() => parsePresentationManifest({ ...fixture(), revision: '0'.repeat(64) }))
      .toThrow(/revision hash mismatch/u)
  })

  it('maps semantic usage and the layout reserve to finite utilities', () => {
    const utilities = presentationUtilities(parsePresentationManifest(fixture()))

    expect(utilities).toEqual(expect.arrayContaining([
      'grid-cols-2',
      'basis-1/2',
      'lg:grid-cols-3',
      'lg:basis-1/3',
      'gap-4',
      'lg:gap-6',
      'py-10',
      'lg:py-20',
      'lg:max-w-3xl',
      'justify-center',
      'md:flex',
      'text-start',
      'md:gap-4',
      'mt-0',
      'mt-8',
      'grid-cols-[minmax(0,1fr)_2fr]',
      'text-[#123456]',
      'border-white/10',
      'custom-project-class',
      'group-hover/item:block',
      'lg:text-left',
      'peer-checked/field:block',
      '@container',
      '[&_[data-active]]:block',
      'max-w-none!',
      'xl:px-[calc((100vw-72rem)/2+1.5rem)]',
      'lg:grid-cols-[8fr_4fr]',
    ]))
  })

  it('emits literal Tailwind 4 inline sources', () => {
    const source = inlinePresentationSource(['gap-4', 'grid-cols-2'])

    expect(source).toBe('@source inline("gap-4 grid-cols-2");\n')
  })

  it('gives generated sources a deterministic identity', () => {
    const manifest = parsePresentationManifest(fixture())
    const source = buildPresentationSource(manifest)
    const repeated = buildPresentationSource(manifest)

    expect(repeated).toEqual(source)
    expect(source.sourceRevision).toMatch(/^[a-f0-9]{64}$/u)
    expect(source.manifestUsageCount).toBe(22)
    expect(source.legacyUtilityCount).toBe(14)
    expect(source.rejectedLegacyUtilityCount).toBe(0)
    expect(source.sourceBytes).toBe(Buffer.byteLength(source.source, 'utf8'))
  })

  it('uses a last-known file only under the explicit availability policy', async () => {
    const manifest = await loadPresentationManifest({
      source: 'tests/fixtures/missing-presentation-manifest.json',
      lastKnownPath: 'contracts/stir-tools/v1/fixtures/presentation-usage-manifest.json',
    })

    expect(manifest.site.uuid).toBe('fixture-site')
    await expect(loadPresentationManifest({
      source: 'tests/fixtures/missing-presentation-manifest.json',
    })).rejects.toThrow()
  })

  it('compiles safe literal CMS values outside the canonical semantic recipes', () => {
    const input = fixture()
    const warnings: string[] = []

    input.used.width = ['w-3xl', 'w-4xl', 'w-full']
    input.used.spacing = ['mt-8', 'pt-20 pb-0', 'py-12 lg:py-16', 'py-16']
    input.used.alignment = ['left']
    const { revision: _revision, ...payload } = input

    input.revision = createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex')

    const utilities = presentationUtilities(parsePresentationManifest(input), {
      warn: message => warnings.push(message),
    })

    expect(utilities).toEqual(expect.arrayContaining([
      'mt-8',
      'pt-10',
      'lg:pt-20',
      'pb-0',
      'py-12',
      'lg:py-16',
      'py-16',
      'w-3xl',
      'w-4xl',
      'w-full',
      'left',
    ]))
    expect(warnings).toEqual([])
  })

  it('warns and skips malformed semantic class tokens without stopping compilation', () => {
    const input = fixture()
    const warnings: string[] = []

    input.used.spacing = ['mt-8 bg-[url(evil)]']
    input.used.width = ['w-full;@source']
    const { revision: _revision, ...payload } = input

    input.revision = createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex')

    const utilities = presentationUtilities(parsePresentationManifest(input), {
      warn: message => warnings.push(message),
    })

    expect(utilities).toContain('mt-8')
    expect(utilities).not.toContain('bg-[url(evil)]')
    expect(utilities).not.toContain('w-full;@source')
    expect(warnings).toHaveLength(2)
  })

  it('compiles accepted utilities when Drupal reports rejected legacy classes', () => {
    const input = fixture()

    input.diagnostics.rejectedLegacyClassCount = 2
    const { revision: _revision, ...payload } = input

    input.revision = createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex')

    expect(presentationUtilities(parsePresentationManifest(input)))
      .toContain('border-white/10')
  })

  it('warns and skips unsafe free-form tokens while keeping safe project tokens', () => {
    const input = fixture()
    const warnings: string[] = []

    input.legacyClasses = [
      'project-card-accent',
      ['bg-', '[url(evil)]'].join(''),
      ['before:content-[', String.fromCharCode(34), ');@source', String.fromCharCode(34), ']'].join(''),
    ]
    const { revision: _revision, ...payload } = input

    input.revision = createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex')

    const utilities = presentationUtilities(parsePresentationManifest(input), {
      warn: message => warnings.push(message),
    })

    expect(utilities).toContain('project-card-accent')
    expect(utilities).not.toContain('bg-[url(evil)]')
    expect(warnings).toHaveLength(2)
    expect(warnings).toEqual(expect.arrayContaining([
      'Ignored unsafe CMS presentation class token: bg-[url(evil)]',
      expect.stringContaining('Ignored unsafe CMS presentation class token: before:content-['),
    ]))
  })

  it('does not hide an invalid primary manifest behind the availability fallback', async () => {
    await expect(loadPresentationManifest({
      source: 'package.json',
      lastKnownPath: 'contracts/stir-tools/v1/fixtures/presentation-usage-manifest.json',
    })).rejects.toThrow(/Invalid CMS presentation manifest/u)
  })
})
