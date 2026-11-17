// Which srcset candidate a browser picks, from the emitted sizes and srcset,
// so image delivery can be checked against what is shown across viewports and
// pixel densities without a browser.

const MEDIA = /^\(\s*(min|max)-(width|resolution):\s*(\d+(?:\.\d+)?)(px|dppx)\s*\)$/

function lengthPx(value, viewport) {
  const trimmed = value.trim()
  const calc = /^calc\(\s*(\d+(?:\.\d+)?)vw\s*([+-])\s*(\d+(?:\.\d+)?)px\s*\)$/.exec(trimmed)

  if (calc) {
    const vw = (Number(calc[1]) / 100) * viewport

    return calc[2] === '-' ? vw - Number(calc[3]) : vw + Number(calc[3])
  }

  const match = /^(\d+(?:\.\d+)?)(px|vw)$/.exec(trimmed)

  if (!match) throw new Error(`Unsupported sizes length: ${value}`)

  return match[2] === 'vw' ? (Number(match[1]) / 100) * viewport : Number(match[1])
}

// Splits on commas outside parentheses.
const sizesEntries = sizes => sizes.split(/,(?![^(]*\))/).map(part => part.trim()).filter(Boolean)

/**
 * The slot width `sizes` gives at a viewport width: the first entry whose
 * media query matches. A leading `auto` (lazy images) is skipped, as browsers
 * without support for it do.
 */
export function sizesWidth(sizes, viewport, dpr = 1) {
  for (const entry of sizesEntries(sizes)) {
    if (entry === 'auto') continue

    // The media condition is the leading run of `(...)` joined by `and`.
    const media = /^(?:\([^()]*\)\s*(?:and\s+)?)*/.exec(entry)?.[0] ?? ''.trim()
    const value = entry.slice(media.length).trim()

    if (mediaMatches(media, viewport, dpr)) return lengthPx(value, viewport)
  }

  return viewport
}

/** srcset width candidates, ascending, as { url, width }. */
export function parseSrcset(srcset) {
  return srcset
    .split(/,\s+(?=\S)/)
    .map((entry) => {
      const [url = '', descriptor = ''] = entry.trim().split(/\s+/)

      return { url, width: Number.parseInt(descriptor) }
    })
    .filter(candidate => candidate.url && candidate.width > 0)
    .sort((a, b) => a.width - b.width)
}

/**
 * The candidate a browser takes: the smallest whose width covers the slot at
 * the device pixel ratio, else the largest. Browsers cap the ratio they plan
 * for at about 2, as the image audit does.
 */
export function pickCandidate(candidates, slotWidth, dpr) {
  const needed = slotWidth * Math.min(dpr, 2)

  return candidates.find(candidate => candidate.width >= needed) ?? candidates.at(-1)
}

/** Whether a media condition (min/max width or resolution, joined by `and`) matches. */
export function mediaMatches(media, viewport, dpr = 1) {
  return !media || media.split(/\s+and\s+/).every((query) => {
    const match = MEDIA.exec(query.trim())

    if (!match) throw new Error(`Unsupported media query: ${query}`)

    const actual = match[2] === 'width' ? viewport : dpr

    return match[1] === 'max' ? actual <= Number(match[3]) : actual >= Number(match[3])
  })
}
