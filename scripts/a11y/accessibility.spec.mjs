import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
const accessibilityTags = [
  'wcag2a',
  'wcag2aa',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
]
const routes = (process.env.A11Y_ROUTES ?? '/')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean)
const rootSelector = process.env.A11Y_ROOT_SELECTOR ?? '#__nuxt'
const documentMode = process.env.A11Y_DOCUMENT_MODE !== 'widget'
const hoverSelector =
  process.env.A11Y_HOVER_SELECTOR ?? '[data-a11y-scan-hover]'
const opaqueSelector =
  process.env.A11Y_OPAQUE_SELECTOR ?? '[data-a11y-scan-opaque]'
const configuredStateSettleMs = Number.parseInt(
  process.env.A11Y_STATE_SETTLE_MS ?? '350',
  10,
)
const stateSettleMs = Number.isFinite(configuredStateSettleMs)
  ? Math.max(configuredStateSettleMs, 0)
  : 350
const configuredMotionSettleMs = Number.parseInt(
  process.env.A11Y_MOTION_SETTLE_MS ?? '1200',
  10,
)
const motionSettleMs = Number.isFinite(configuredMotionSettleMs)
  ? Math.max(configuredMotionSettleMs, 0)
  : 1200
const parseHexColor = (color) => {
  const match = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
  if (!match) return void 0
  return [
    Number.parseInt(match[1] ?? '', 16),
    Number.parseInt(match[2] ?? '', 16),
    Number.parseInt(match[3] ?? '', 16),
  ]
}
const toHexColor = (color) =>
  `#${color
    .map((channel) =>
      Math.round(channel).toString(16).padStart(2, '0').toUpperCase(),
    )
    .join('')}`
const relativeLuminance = (color) => {
  const [red, green, blue] = color.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}
const contrastRatio = (foreground, background) => {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  )
}
const colorDistance = (first, second) =>
  Math.sqrt(
    first.reduce(
      (total, channel, index) =>
        total + (channel - (second[index] ?? channel)) ** 2,
      0,
    ),
  )
const nearestPassingColor = (
  adjustableColor,
  fixedColor,
  minimumRatio,
  adjustForeground,
) => {
  const candidates = []
  for (const target of [
    [0, 0, 0],
    [255, 255, 255],
  ]) {
    for (let step = 0; step <= 1e3; step += 1) {
      const amount = step / 1e3
      const candidate = adjustableColor.map((channel, index) =>
        Math.round(channel + ((target[index] ?? channel) - channel) * amount),
      )
      const ratio = adjustForeground
        ? contrastRatio(candidate, fixedColor)
        : contrastRatio(fixedColor, candidate)
      if (ratio >= minimumRatio) {
        candidates.push(candidate)
        break
      }
    }
  }
  return candidates.sort(
    (first, second) =>
      colorDistance(adjustableColor, first) -
      colorDistance(adjustableColor, second),
  )[0]
}
const isContrastData = (data) => {
  if (!data || typeof data !== 'object') return false
  const candidate = data
  return (
    typeof candidate.bgColor === 'string' &&
    typeof candidate.fgColor === 'string' &&
    typeof candidate.expectedContrastRatio === 'string'
  )
}
const formatContrastSuggestions = (data) => {
  if (!isContrastData(data)) return ''
  const foreground = parseHexColor(data.fgColor)
  const background = parseHexColor(data.bgColor)
  const minimumRatio = Number.parseFloat(data.expectedContrastRatio)
  if (!foreground || !background || !Number.isFinite(minimumRatio)) return ''
  const foregroundSuggestion = nearestPassingColor(
    foreground,
    background,
    minimumRatio,
    true,
  )
  const backgroundSuggestion = nearestPassingColor(
    background,
    foreground,
    minimumRatio,
    false,
  )
  const suggestions = [
    foregroundSuggestion
      ? `foreground ${toHexColor(foregroundSuggestion)} (${contrastRatio(foregroundSuggestion, background).toFixed(2)}:1)`
      : '',
    backgroundSuggestion
      ? `background ${toHexColor(backgroundSuggestion)} (${contrastRatio(foreground, backgroundSuggestion).toFixed(2)}:1)`
      : '',
  ].filter(Boolean)
  return suggestions.length
    ? `
    Nearest passing suggestions: ${suggestions.join(' or ')}
    Apply the smallest contextual fix to this element and state. Do not replace a shared brand or semantic color token unless every use of that token has been visually and accessibly audited.`
    : ''
}
const formatViolations = (violations) =>
  violations
    .map((violation) => {
      const nodes = violation.nodes
        .map(
          (node) => `  - ${node.target.join(' ')}
    ${node.failureSummary ?? 'No failure summary provided.'}${node.any.map((check) => formatContrastSuggestions(check.data)).join('')}`,
        )
        .join('\n')
      return `${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}
${violation.helpUrl}
${nodes}`
    })
    .join('\n\n')
const assertNoViolations = (violations, context) => {
  if (violations.length === 0) return
  const affectedElements = violations.reduce(
    (total, violation) => total + violation.nodes.length,
    0,
  )
  const ruleLabel = violations.length === 1 ? 'rule' : 'rules'
  const elementLabel = affectedElements === 1 ? 'element' : 'elements'
  throw new Error(
    `Accessibility audit failed ${context}: ${violations.length} ${ruleLabel} affected ${affectedElements} ${elementLabel}.\n\n${formatViolations(violations)}`,
  )
}
const revealFullPage = async (page) => {
  await page.evaluate(async () => {
    const pause = (duration) =>
      new Promise((resolve) => window.setTimeout(resolve, duration))
    const step = Math.max(window.innerHeight * 0.8, 400)
    for (
      let position = 0;
      position < document.documentElement.scrollHeight;
      position += step
    ) {
      window.scrollTo({ top: position, behavior: 'instant' })
      await pause(100)
    }
    window.scrollTo({ top: document.documentElement.scrollHeight })
    await pause(500)
    window.scrollTo({ top: 0 })
    await pause(250)
  })
}
const revealStableFullPage = async (page) => {
  try {
    await revealFullPage(page)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes('Execution context was destroyed')) throw error

    // Nuxt may perform one client navigation while a managed dev server warms.
    // Wait for the replacement document and repeat the read-only reveal once.
    // A second interruption remains a real test failure.
    await page.waitForLoadState('load')
    await page.locator('main').waitFor({ state: 'visible' })
    if (documentMode) await page.locator('h1').waitFor({ state: 'visible' })
    await revealFullPage(page)
  }
}
const analyzePage = (page, includeSelector) => {
  const builder = new AxeBuilder({ page })
    .exclude('nuxt-devtools-frame')
    .exclude('.nuxt-devtools-label')
    .withTags(accessibilityTags)

  if (includeSelector) builder.include(includeSelector)
  if (!documentMode) builder.disableRules(['page-has-heading-one'])

  return builder.analyze()
}
const transitionRaceRuleIds = new Set([
  'landmark-one-main',
  'page-has-heading-one',
])
const isTransitionRace = (violations) => {
  if (
    violations.length === 0 ||
    violations.some((violation) => !transitionRaceRuleIds.has(violation.id))
  ) {
    return false
  }

  return true
}
const analyzeStablePage = async (page, includeSelector) => {
  const results = await analyzePage(page, includeSelector)
  if (!isTransitionRace(results.violations)) return results

  // Page transitions can replace the semantic page subtree while Axe is
  // taking its snapshot. Wait for the final structure and retry once. A real
  // omission still fails at these explicit landmark gates rather than being
  // hidden by the retry.
  await page.waitForLoadState('load')
  await page.locator('main').waitFor({ state: 'visible' })
  if (documentMode) await page.locator('h1').waitFor({ state: 'visible' })
  await page.waitForTimeout(motionSettleMs)
  await expect(page.locator('main')).toHaveCount(1)
  if (documentMode) await expect(page.locator('h1')).toHaveCount(1)
  return analyzePage(page, includeSelector)
}
test.describe('automated accessibility', () => {
  for (const route of routes) {
    test(`${route} has no detectable WCAG or best-practice violations`, async ({
      page,
    }, testInfo) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response?.ok(), `Expected ${route} to load successfully`).toBe(
        true,
      )
      await page.locator(rootSelector).waitFor({ state: 'attached' })
      await page.waitForLoadState('load')
      // Nuxt can replace the hydrated page subtree after the root container is
      // attached. These are baseline document requirements, so wait for the
      // final landmarks before Axe observes the page. A genuinely missing
      // landmark or heading still fails deterministically at this boundary.
      await page.locator('main').first().waitFor({ state: 'attached' })
      if (documentMode) {
        await page.locator('h1').first().waitFor({ state: 'attached' })
      }
      // Measure stable rendered colors rather than a midpoint from a theme,
      // hover, carousel, or hydration transition.
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-delay: 0s !important;
            animation-duration: 0s !important;
            scroll-behavior: auto !important;
            transition-delay: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      })
      await revealStableFullPage(page)
      await page.waitForTimeout(motionSettleMs)
      const results = await analyzeStablePage(page)
      await testInfo.attach('axe-results', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      })
      assertNoViolations(results.violations, `on ${route}`)
      const opaqueTargets = page.locator(opaqueSelector)
      for (let index = 0; index < (await opaqueTargets.count()); index += 1) {
        const opaqueTarget = opaqueTargets.nth(index)
        if (!(await opaqueTarget.isVisible())) continue
        await expect(
          opaqueTarget,
          `Opaque target ${index + 1} on ${route} needs a real resting background for accessibility scanners`,
        ).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      }
      const hoverTargets = page.locator(hoverSelector)
      for (let index = 0; index < (await hoverTargets.count()); index += 1) {
        const hoverTarget = hoverTargets.nth(index)
        if (!(await hoverTarget.isVisible())) continue
        await hoverTarget.hover()
        await page.waitForTimeout(Math.max(stateSettleMs, motionSettleMs))
        await hoverTarget.evaluate((element) =>
          element.setAttribute('data-a11y-active-scan', ''),
        )
        const hoverResults = await analyzeStablePage(
          page,
          '[data-a11y-active-scan]',
        )
        await hoverTarget.evaluate((element) =>
          element.removeAttribute('data-a11y-active-scan'),
        )
        await testInfo.attach(`axe-results-hover-target-${index}`, {
          body: JSON.stringify(hoverResults, null, 2),
          contentType: 'application/json',
        })
        assertNoViolations(
          hoverResults.violations,
          `while hovering target ${index + 1} on ${route}`,
        )
      }
    })
  }
})
