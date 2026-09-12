import { describe, expect, it } from 'vitest'
import { describeGrowth, entryModuleGrowth, totalByModule } from '../../scripts/perf/growth.mjs'

type EntryModule = { id: string, renderedBytes: number }

const report = (gzipKb: number, entryModules: EntryModule[]) => ({
  initialClient: { gzipKb, entryModules },
})

describe('perf budget growth attribution', () => {
  it('sums a module that appears more than once in the entry graph', () => {
    const totals = totalByModule([
      { id: 'vendor:a', renderedBytes: 100 },
      { id: 'vendor:a', renderedBytes: 50 },
      { id: 'vendor:b', renderedBytes: 25 },
    ])

    expect(totals.get('vendor:a')).toBe(150)
    expect(totals.get('vendor:b')).toBe(25)
  })

  it('reports no growth when duplicated modules are unchanged', () => {
    // Aggregating one side but not the other previously reported a large
    // fabricated increase for any module with duplicate entries.
    const modules = [
      { id: 'vendor:a', renderedBytes: 100 },
      { id: 'vendor:a', renderedBytes: 50 },
    ]

    expect(entryModuleGrowth(modules, [...modules])).toEqual([])
  })

  it('attributes growth to the modules that grew or appeared', () => {
    const growth = entryModuleGrowth(
      [
        { id: 'vendor:kept', renderedBytes: 100 },
        { id: 'vendor:grew', renderedBytes: 3000 },
        { id: 'vendor:added', renderedBytes: 8000 },
      ],
      [
        { id: 'vendor:kept', renderedBytes: 100 },
        { id: 'vendor:grew', renderedBytes: 1000 },
      ],
    )

    expect(growth).toEqual([
      { id: 'vendor:added', delta: 8000, isNew: true },
      { id: 'vendor:grew', delta: 2000, isNew: false },
    ])
  })

  it('ignores modules that shrank or disappeared', () => {
    const growth = entryModuleGrowth(
      [{ id: 'vendor:shrank', renderedBytes: 10 }],
      [
        { id: 'vendor:shrank', renderedBytes: 100 },
        { id: 'vendor:removed', renderedBytes: 500 },
      ],
    )

    expect(growth).toEqual([])
  })

  it('names the new dependency in the failure message', () => {
    const message = describeGrowth(
      report(236, [{ id: 'vendor:tracker', renderedBytes: 7739 }]),
      report(230, []),
    )

    expect(message).toContain('+6.00 kB gzip')
    expect(message).toContain('+new vendor:tracker')
    expect(message).toContain('7.6 kB')
  })

  it('stays silent without a committed baseline to compare against', () => {
    expect(describeGrowth(report(236, []), undefined)).toBe('')
    expect(describeGrowth(report(236, []), {} as never)).toBe('')
  })
})
