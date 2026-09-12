/**
 * Attributes initial-graph growth to the entry modules that caused it.
 *
 * A budget failure that only prints a total tells you that you are over, not
 * what put you there. Comparing entry modules against the committed baseline
 * names the packages that grew or appeared, which is usually the dependency
 * that was just added.
 */

// A package can appear several times in the entry graph, so both sides must be
// aggregated the same way or the difference is meaningless.
export function totalByModule(modules) {
  const totals = new Map()

  for (const module of modules ?? []) {
    totals.set(module.id, (totals.get(module.id) ?? 0) + module.renderedBytes)
  }

  return totals
}

export function entryModuleGrowth(currentModules, previousModules, limit = 5) {
  const before = totalByModule(previousModules)
  const after = totalByModule(currentModules)

  for (const id of before.keys()) {
    if (!after.has(id)) after.set(id, 0)
  }

  return [...after.entries()]
    .map(([id, bytes]) => ({
      id,
      delta: bytes - (before.get(id) ?? 0),
      isNew: !before.has(id),
    }))
    .filter(entry => entry.delta > 0)
    .sort((first, second) => second.delta - first.delta)
    .slice(0, limit)
}

export function describeGrowth(report, previous) {
  if (!previous?.initialClient?.entryModules) return ''

  const grew = entryModuleGrowth(
    report.initialClient?.entryModules,
    previous.initialClient.entryModules,
  )
  const previousGzipKb = previous.initialClient.gzipKb ?? 0
  const totalDelta = (report.initialClient?.gzipKb ?? 0) - previousGzipKb
  const lines = []

  if (totalDelta !== 0) {
    lines.push(
      `Initial graph moved ${totalDelta > 0 ? '+' : ''}${totalDelta.toFixed(2)} kB gzip `
      + `since the committed baseline (${previousGzipKb.toFixed(2)} kB).`,
    )
  }

  if (grew.length) {
    lines.push('Largest entry-module growth (raw bytes):')
    for (const entry of grew) {
      lines.push(
        `  ${entry.isNew ? '+new ' : '     '}${entry.id}: +${(entry.delta / 1024).toFixed(1)} kB`,
      )
    }
  }

  return lines.length ? `\n\n${lines.join('\n')}` : ''
}
