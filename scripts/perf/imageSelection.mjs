// Which srcset candidate a browser picks, from the emitted sizes and srcset,
// so image delivery can be checked against what is shown across viewports and
// pixel densities without a browser.

const MEDIA = /^\(\s*(min|max)-width:\s*(\d+(?:\.\d+)?)px\s*\)$/

function lengthPx(value, viewport) {
  const match = /^(\d+(?:\.\d+)?)(px|vw)$/.exec(value.trim())

  if (!match) throw new Error(`Unsupported sizes length: ${value}`)

  return match[2] === 'vw' ? (Number(match[1]) / 100) * viewport : Number(match[1])
}

/** The slot width `sizes` gives at a viewport width: the first entry whose media query matches. */
export function sizesWidth(sizes, viewport) {
  for (const entry of sizes.split(',').map(part => part.trim()).filter(Boolean)) {
    const split = entry.lastIndexOf(' ')
    const media = split > 0 ? entry.slice(0, split).trim() : ''
    const value = split > 0 ? entry.slice(split + 1) : entry

    if (!media) return lengthPx(value, viewport)

    const match = MEDIA.exec(media)

    if (!match) throw new Error(`Unsupported sizes media query: ${media}`)

    const limit = Number(match[2])

    if (match[1] === 'max' ? viewport <= limit : viewport >= limit) {
      return lengthPx(value, viewport)
    }
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
