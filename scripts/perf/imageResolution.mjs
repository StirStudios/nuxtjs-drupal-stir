// Image resolution check for audit:perf. Lighthouse's own check only sees
// images in the first viewport and its byte audits only flag images that are
// too large, so an image requested too small (and upscaled) passes them. This
// scrolls each route so lazy images load, then compares the pixels each image
// delivered with the pixels it is shown at, both ways: too small (upscaled)
// and far too large (over-fetched).

// Screens at DPR 3 still get 2x images, the usual cap (Lighthouse's too).
export const IMAGE_VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080, deviceScaleFactor: 1 },
  { name: 'laptop', width: 1400, height: 900, deviceScaleFactor: 2 },
  { name: 'small laptop', width: 1280, height: 800, deviceScaleFactor: 2 },
  { name: 'tablet landscape', width: 1024, height: 768, deviceScaleFactor: 2 },
  { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
]

const TOLERANCE = 0.9
// A browser picks the smallest candidate that covers its need, so a gap
// between srcset widths alone over-fetches by up to the step between them.
const OVERSIZE = 1.5
const MIN_SHOWN_PX = 64

/**
 * The pixels an image needs: its shown width times the device pixel ratio.
 * An object-fit: cover image wider than its box is shown at the box height
 * times its own aspect ratio, so it needs more than the box width.
 */
export function neededWidth({ boxWidth, boxHeight, aspectRatio, cover }, dpr) {
  const shown = cover && aspectRatio > boxWidth / boxHeight
    ? boxHeight * aspectRatio
    : boxWidth

  return Math.ceil(shown * Math.min(dpr, 2))
}

/**
 * error: a larger candidate was in srcset but `sizes` led the browser to a
 * smaller one, or a much smaller candidate would have covered the need but
 * `sizes` led it to a far larger one (code faults). warning: the largest image
 * available is still smaller than shown (the source upload is too small).
 */
export function classifyImage(image, dpr) {
  if (image.boxWidth < MIN_SHOWN_PX || !image.deliveredWidth) return undefined

  const needed = neededWidth(image, dpr)

  if (image.deliveredWidth > needed * OVERSIZE) {
    const enough = (image.candidateWidths ?? [])
      .filter(width => width >= needed * TOLERANCE)
      .sort((a, b) => a - b)[0]

    return enough && enough * OVERSIZE < image.deliveredWidth
      ? { level: 'error', kind: 'oversized', needed, available: enough }
      : undefined
  }

  if (image.deliveredWidth >= needed * TOLERANCE) return undefined

  const available = Math.max(image.deliveredWidth, image.largestWidth ?? 0)

  return {
    level: available > image.deliveredWidth * 1.05 ? 'error' : 'warning',
    kind: 'undersized',
    needed,
    available,
  }
}

// Runs in the page: scroll so lazy images load, then describe each image.
async function describeImages() {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.75)) {
    scrollTo(0, y)
    await sleep(150)
  }

  const images = [...document.images].filter(image => image.currentSrc && image.getBoundingClientRect().width > 0)

  for (let tries = 0; tries < 40 && images.some(image => !image.complete); tries++) await sleep(250)

  const pixelWidth = async (url) => {
    try {
      const bitmap = await createImageBitmap(await fetch(url).then(response => response.blob()))
      const width = bitmap.width

      bitmap.close()
      return width
    }
    catch {
      return 0
    }
  }

  return Promise.all(images.map(async (image) => {
    const box = image.getBoundingClientRect()
    const deliveredWidth = await pixelWidth(image.currentSrc)
    const candidates = image.srcset
      .split(',')
      .map(entry => entry.trim().split(/\s+/))
      .filter(([, descriptor]) => descriptor?.endsWith('w'))
      .sort((a, b) => Number.parseInt(b[1]) - Number.parseInt(a[1]))
    const largest = candidates[0]?.[0]

    return {
      src: image.currentSrc,
      alt: image.alt,
      boxWidth: box.width,
      boxHeight: box.height,
      cover: getComputedStyle(image).objectFit === 'cover',
      aspectRatio: image.naturalHeight ? image.naturalWidth / image.naturalHeight : 0,
      deliveredWidth,
      candidateWidths: candidates.map(([, descriptor]) => Number.parseInt(descriptor)),
      largestWidth: largest && new URL(largest, location.href).href !== image.currentSrc
        ? await pixelWidth(largest)
        : deliveredWidth,
    }
  }))
}

export async function auditImageResolution(urls) {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
  const findings = []

  try {
    for (const viewport of IMAGE_VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
      })
      const page = await context.newPage()

      for (const url of urls) {
        await page.goto(url, { waitUntil: 'networkidle' })

        for (const image of await page.evaluate(describeImages)) {
          const result = classifyImage(image, viewport.deviceScaleFactor)

          if (result) findings.push({ ...result, url, viewport: viewport.name, image })
        }
      }

      await context.close()
    }
  }
  finally {
    await browser.close()
  }

  return findings
}

export function describeFinding({ url, viewport, image, kind, needed, available }) {
  const file = decodeURIComponent(new URL(image.src).pathname.split('/').pop() ?? image.src)
  const shown = `${Math.round(image.boxWidth)}x${Math.round(image.boxHeight)}${image.cover ? ' cover' : ''}`

  return `${new URL(url).pathname} ${viewport}: ${file} (${shown}) delivered ${image.deliveredWidth}px, needs ${needed}px; `
    + (kind === 'oversized'
      ? `a ${available}px candidate was enough, so its sizes is too large.`
      : available > image.deliveredWidth
      ? `${available}px was available, so its sizes is too small.`
      : 'the source is too small.')
}
