import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  buildPresentationSource,
  compatibilityPresentationUtilities,
  inlinePresentationSource,
  loadPresentationManifest,
  parsePresentationManifest,
  presentationUtilities,
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
    schemaVersion: 1 as const,
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
    legacyClasses: ['md:gap-4'],
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
  it('validates schema and deterministic revision', () => {
    expect(parsePresentationManifest(fixture()).schemaVersion).toBe(1)
    expect(() => parsePresentationManifest({ ...fixture(), revision: '0'.repeat(64) }))
      .toThrow(/revision hash mismatch/u)
  })

  it('maps semantic usage and the layout reserve to finite utilities', () => {
    const utilities = presentationUtilities(parsePresentationManifest(fixture()), 'strict')

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
      'lg:grid-cols-[8fr_4fr]',
    ]))
  })

  it('keeps the transitional compatibility policy finite and centralized', () => {
    const utilities = compatibilityPresentationUtilities()

    expect(utilities).toEqual(expect.arrayContaining([
      'grid-cols-12',
      '2xl:grid-cols-12',
      'col-span-2',
      'sm:columns-2',
      'basis-1/12',
      '2xl:basis-1/12',
      'gap-20',
      '2xl:gap-20',
      'p-20',
      'lg:p-20',
      'lg:grid-cols-[8fr_4fr]',
    ]))
    expect(new Set(utilities).size).toBe(utilities.length)
    expect(utilities.every(utility => !utility.includes('[') || utility.includes('grid-cols-['))).toBe(true)
  })

  it('emits literal Tailwind 4 inline sources', () => {
    const source = inlinePresentationSource(['gap-4', 'grid-cols-2'])

    expect(source).toBe('@source inline("gap-4 grid-cols-2");\n')
  })

  it('gives generated sources a deterministic mode-aware identity', () => {
    const manifest = parsePresentationManifest(fixture())
    const strict = buildPresentationSource(manifest, 'strict')
    const repeated = buildPresentationSource(manifest, 'strict')
    const hybrid = buildPresentationSource(manifest, 'hybrid')

    expect(repeated).toEqual(strict)
    expect(strict.sourceRevision).toMatch(/^[a-f0-9]{64}$/u)
    expect(hybrid.sourceRevision).not.toBe(strict.sourceRevision)
    expect(hybrid.utilityCount).toBeGreaterThan(strict.utilityCount)
    expect(strict.manifestUsageCount).toBe(9)
    expect(strict.legacyUtilityCount).toBe(1)
    expect(strict.rejectedLegacyUtilityCount).toBe(0)
    expect(strict.sourceBytes).toBe(Buffer.byteLength(strict.source, 'utf8'))
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

  it('rejects unknown semantic values even with a valid manifest hash', () => {
    const input = fixture()

    input.used.width = ['w-arbitrary']
    const { revision: _revision, ...payload } = input

    input.revision = createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex')

    expect(() => presentationUtilities(parsePresentationManifest(input), 'strict'))
      .toThrow(/Unsupported semantic width/u)
  })

  it('fails optimized builds when Drupal reports rejected legacy classes', () => {
    const input = fixture()

    input.diagnostics.rejectedLegacyClassCount = 2
    const { revision: _revision, ...payload } = input

    input.revision = createHash('sha256')
      .update(JSON.stringify(canonicalize(payload)))
      .digest('hex')

    expect(() => presentationUtilities(parsePresentationManifest(input), 'strict'))
      .toThrow(/reports 2 rejected legacy utilities/u)
  })

  it('does not hide an invalid primary manifest behind the availability fallback', async () => {
    await expect(loadPresentationManifest({
      source: 'package.json',
      lastKnownPath: 'contracts/stir-tools/v1/fixtures/presentation-usage-manifest.json',
    })).rejects.toThrow(/Invalid CMS presentation manifest/u)
  })
})
