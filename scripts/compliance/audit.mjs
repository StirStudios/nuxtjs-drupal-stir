#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { readUrlArgument, resolveSiteUrl } from '../seo/html.mjs'
import { collectSignals, evaluateServices, loadLegalText, plainText } from './discovery.mjs'
import { missingReviewMarkers } from './review.mjs'
import { webformFindings } from './webforms.mjs'

const projectRoot = resolve(process.cwd())
const configPath = resolve(projectRoot, 'compliance/site.json')
const reviewPath = resolve(projectRoot, 'compliance/REVIEW.md')
let siteUrl = ''
const errors = []
const warnings = []
const notes = []

const error = message => errors.push(message)
const warn = message => warnings.push(message)
// Before cutover the public domain still serves someone else's site, so
// findings about it describe a site the project does not control yet.
let prelaunch = false
const liveIssue = message => (prelaunch ? warn(`${message} (pre-launch)`) : error(message))
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

function daysFromToday(value) {
  const target = new Date(`${value}T00:00:00Z`)
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000)
}

async function collectSourceFiles(directory) {
  const files = []
  try {
    for (const entry of await readdir(directory)) {
      if (['.git', '.nuxt', '.output', 'node_modules', 'dist', 'coverage'].includes(entry)) continue
      const path = resolve(directory, entry)
      const info = await stat(path)
      if (info.isDirectory()) files.push(...await collectSourceFiles(path))
      else if (/\.(?:js|mjs|cjs|ts|tsx|vue|json|html)$/.test(entry)) files.push(path)
    }
  } catch {
    // Optional source directories do not exist in every consumer.
  }
  return files
}

async function findDrupalConfigDirectory() {
  for (const directory of [
    resolve(projectRoot, 'config/sync'),
    resolve(projectRoot, '../config/sync'),
  ]) {
    try {
      if ((await stat(directory)).isDirectory()) return directory
    } catch {
      // Try the next conventional decoupled-project location.
    }
  }
  return null
}

async function checkDrupalWebforms() {
  const directory = await findDrupalConfigDirectory()
  if (!directory) {
    warn('Drupal config export was not found; Webform defaults were not verified.')
    return
  }

  let settingsSource = null
  try {
    settingsSource = await readFile(resolve(directory, 'webform.settings.yml'), 'utf8')
  } catch (cause) {
    error(`Unable to verify Drupal Webform defaults: ${cause.message}`)
  }

  const forms = []
  for (const entry of await readdir(directory)) {
    if (/^webform\.webform\..+\.yml$/.test(entry)) {
      forms.push({ source: await readFile(resolve(directory, entry), 'utf8') })
    }
  }

  webformFindings({
    settingsSource,
    forms,
    dataHandling: config.dataHandling,
    formIds: config.technology?.formIds,
  }).forEach(error)
}

async function checkPublicDocument(document) {
  const url = `${siteUrl}${document.path}`
  try {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) {
      liveIssue(`${document.title} returned HTTP ${response.status} at ${url}.`)
      return
    }
    const html = await response.text()
    if (!html.toLowerCase().includes(document.title.toLowerCase())) {
      warn(`${document.title} was not found in the rendered page at ${url}.`)
    }
    if (/app\.enzuzo\.com|__enzuzo/i.test(html)) {
      liveIssue(`${document.title} still contains an Enzuzo embed.`)
    }
    if (/userway|accessibility widget/i.test(html)) {
      liveIssue(`${document.title} still contains a UserWay/widget reference.`)
    }
    // A pre-launch domain is not this project's copy, so it must never stand in
    // for tracked legal text when services are held to their disclosures.
    return prelaunch ? undefined : plainText(html)
  } catch (cause) {
    liveIssue(`Unable to verify ${url}: ${cause.message}`)
  }
}

let config
try {
  config = JSON.parse(await readFile(configPath, 'utf8'))
} catch (cause) {
  error(`Unable to read compliance/site.json: ${cause.message}`)
}

if (config) {
  // Always audit the inventory's production domain unless --url is passed.
  const urlArgument = readUrlArgument()
  siteUrl = resolveSiteUrl(urlArgument, config)
  if (siteUrl) notes.push(`TARGET ${siteUrl}`)
  else error('owner.domain must be a valid site origin, or pass --url <origin>.')

  if (config.version !== 1) error('compliance/site.json must use version 1.')
  if (config.prelaunch !== undefined && typeof config.prelaunch !== 'boolean') {
    error('prelaunch must be true or false when provided.')
  }
  // Pre-launch describes owner.domain only. An explicitly audited origin is one
  // the project already serves, so findings there stay errors.
  prelaunch = config.prelaunch === true && !urlArgument
  if (prelaunch) {
    notes.push(`PRELAUNCH ${siteUrl} is not serving this project yet; live page findings are warnings.`)
  }
  if (JSON.stringify(config).includes('REPLACE_')) {
    error('compliance/site.json still contains starter-template REPLACE_* values.')
  }

  try {
    const review = await readFile(reviewPath, 'utf8')
    if (missingReviewMarkers(review).length) {
      error('compliance/REVIEW.md is outdated; run stir-compliance-init to install the current review checklists.')
    }
  } catch (cause) {
    error(`Unable to read compliance/REVIEW.md: ${cause.message}`)
  }

  for (const field of ['legalName', 'brandName', 'domain', 'email', 'address']) {
    if (!config.owner?.[field]?.trim()) error(`owner.${field} is required.`)
  }
  if (config.owner?.privacyEmail !== undefined && !/^[^@\s]+@[^@\s]+$/.test(config.owner.privacyEmail)) {
    error('owner.privacyEmail must be an email address when provided.')
  }

  if (!validDate(config.review?.lastReviewed)) error('review.lastReviewed must use YYYY-MM-DD.')
  if (!validDate(config.review?.nextReview)) error('review.nextReview must use YYYY-MM-DD.')
  else {
    const days = daysFromToday(config.review.nextReview)
    if (days < 0) error(`Compliance review is overdue by ${Math.abs(days)} day(s).`)
    else if (days <= 30) warn(`Compliance review is due in ${days} day(s).`)
  }
  if (config.review?.intervalMonths !== 6) warn('The standard review interval is six months.')

  const renderedDocuments = {}
  for (const key of ['privacy', 'terms', 'accessibility']) {
    const document = config.documents?.[key]
    if (!document?.title || !document?.path?.startsWith('/')) {
      error(`documents.${key} must have a title and root-relative path.`)
      continue
    }
    if (document.source !== 'drupal') error(`documents.${key}.source must be "drupal".`)
    if (document.menu !== 'footer') warn(`${document.title} is not declared in the footer menu.`)
    if (siteUrl) renderedDocuments[key] = await checkPublicDocument(document)
  }

  if (!config.consent?.mode || !config.consent?.reason) {
    error('consent.mode and consent.reason are required.')
  }
  if (config.consent?.mode === 'not-required' && config.technology?.marketingTrackers?.length) {
    error('Consent is marked not-required while marketing trackers are declared.')
  }
  const retention = config.dataHandling?.drupalSubmissionRetention
  if (retention !== 'indefinite' && (!Number.isInteger(retention) || retention <= 0)) {
    error('dataHandling.drupalSubmissionRetention must be a positive day count or "indefinite".')
  }
  if (retention === 'indefinite' && !config.dataHandling?.retentionReason?.trim()) {
    error('Indefinite submission retention requires dataHandling.retentionReason.')
  }
  if (typeof config.dataHandling?.storeSubmitterIpWithSubmission !== 'boolean') {
    error('dataHandling.storeSubmitterIpWithSubmission must be true or false.')
  }
  if (!Array.isArray(config.technology?.formIds)) {
    error('technology.formIds must list every exported Drupal Webform ID.')
  } else {
    await checkDrupalWebforms()
  }
  if (!/WCAG 2\.2.*AA/i.test(config.accessibility?.target ?? '')) {
    warn('Accessibility target is not WCAG 2.2 Level AA.')
  }
  if (config.accessibility?.contact !== config.owner?.email) {
    warn('Accessibility contact differs from the owner contact email.')
  }
  if (!Array.isArray(config.accessibility?.auditRoutes) || !config.accessibility.auditRoutes.length) {
    warn('accessibility.auditRoutes should list representative pages and critical flows for pnpm test:a11y.')
  } else {
    for (const route of config.accessibility.auditRoutes) {
      if (typeof route !== 'string' || !route.startsWith('/')) {
        error('Every accessibility.auditRoutes entry must be a root-relative route.')
      }
    }
  }

  const sourceFiles = [
    ...await collectSourceFiles(resolve(projectRoot, 'app')),
    ...await collectSourceFiles(resolve(projectRoot, 'server')),
    resolve(projectRoot, 'nuxt.config.ts'),
  ]
  const patterns = [
    ['Enzuzo', /app\.enzuzo\.com|__enzuzo/i],
    ['Google Tag Manager', /googletagmanager\.com|GTM-[A-Z0-9]+/i],
    ['Meta Pixel', /connect\.facebook\.net|fbevents\.js|fbq\s*\(/i],
    ['enabled UserWay', /userway\s*:\s*\{\s*enabled\s*:\s*true/i],
  ]

  for (const file of sourceFiles) {
    try {
      const source = await readFile(file, 'utf8')
      for (const [name, pattern] of patterns) {
        if (pattern.test(source)) warn(`${name} reference found in ${relative(projectRoot, file)}.`)
      }
    } catch {
      // Optional source paths may not exist.
    }
  }

  // Discover active services from repository evidence and hold each one to
  // its inventory and disclosure requirements.
  const signals = await collectSignals(projectRoot, await findDrupalConfigDirectory())
  const legal = await loadLegalText(projectRoot, config.documents)
  for (const [key, document] of Object.entries(config.documents ?? {})) {
    if (document?.file && !legal.sources[key]) error(`documents.${key}.file ${document.file} was not found.`)
    if (legal.sources[key]) notes.push(`SOURCE documents.${key}: ${legal.sources[key]}`)
    else if (renderedDocuments[key]) {
      legal.text[key] = renderedDocuments[key]
      notes.push(`SOURCE documents.${key}: ${siteUrl}${document.path}`)
    }
  }
  const services = evaluateServices(signals, config, legal.text)
  for (const line of services.detected) notes.push(`DETECT ${line}`)
  services.warnings.forEach(warn)
  services.errors.forEach(error)
}

console.log('Stir compliance audit')
for (const message of notes) console.log(message)
for (const message of warnings) console.log(`WARN  ${message}`)
for (const message of errors) console.error(`ERROR ${message}`)

if (errors.length) process.exitCode = 1
else console.log(`PASS  ${warnings.length} warning(s), no blocking errors.`)
