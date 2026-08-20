#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

const projectRoot = resolve(process.cwd())
const configPath = resolve(projectRoot, 'compliance/site.json')
const reviewPath = resolve(projectRoot, 'compliance/REVIEW.md')
const siteUrl = process.env.COMPLIANCE_SITE_URL?.replace(/\/$/, '')
const errors = []
const warnings = []

const error = message => errors.push(message)
const warn = message => warnings.push(message)
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

  const settingsPath = resolve(directory, 'webform.settings.yml')
  try {
    const settings = await readFile(settingsPath, 'utf8')
    const disablesIpByDefault = /^\s*default_form_disable_remote_addr:\s*true\s*$/m.test(settings)
    if (disablesIpByDefault !== (config.dataHandling?.storeSubmitterIpWithSubmission === false)) {
      error('Drupal Webform IP default conflicts with dataHandling.storeSubmitterIpWithSubmission.')
    }
  } catch (cause) {
    error(`Unable to verify Drupal Webform defaults: ${cause.message}`)
  }

  const expectedIds = new Set(config.technology?.formIds ?? [])
  const exportedIds = new Set()
  for (const entry of await readdir(directory)) {
    if (!/^webform\.webform\..+\.yml$/.test(entry)) continue
    const source = await readFile(resolve(directory, entry), 'utf8')
    const id = source.match(/^id:\s*['"]?([^'"\s]+)['"]?\s*$/m)?.[1]
    if (!id) continue
    exportedIds.add(id)

    const disablesIp = /^\s*form_disable_remote_addr:\s*true\s*$/m.test(source)
    if (config.dataHandling?.storeSubmitterIpWithSubmission === false && !disablesIp) {
      error(`Drupal Webform ${id} stores the submitter IP contrary to the inventory.`)
    }

    const purge = source.match(/^\s*purge:\s*([^\s#]+)\s*$/m)?.[1]
    if (config.dataHandling?.drupalSubmissionRetention === 'indefinite' && purge !== 'none') {
      error(`Drupal Webform ${id} has automatic purge enabled contrary to indefinite retention.`)
    }
  }

  for (const id of expectedIds) {
    if (!exportedIds.has(id)) error(`Declared Drupal Webform ${id} is missing from the config export.`)
  }
  for (const id of exportedIds) {
    if (!expectedIds.has(id)) error(`Drupal Webform ${id} is not declared in technology.formIds.`)
  }
}

async function checkPublicDocument(document) {
  const url = `${siteUrl}${document.path}`
  try {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) {
      error(`${document.title} returned HTTP ${response.status} at ${url}.`)
      return
    }
    const html = await response.text()
    if (!html.toLowerCase().includes(document.title.toLowerCase())) {
      warn(`${document.title} was not found in the rendered page at ${url}.`)
    }
    if (/app\.enzuzo\.com|__enzuzo/i.test(html)) {
      error(`${document.title} still contains an Enzuzo embed.`)
    }
    if (/userway|accessibility widget/i.test(html)) {
      error(`${document.title} still contains a UserWay/widget reference.`)
    }
  } catch (cause) {
    error(`Unable to verify ${url}: ${cause.message}`)
  }
}

let config
try {
  config = JSON.parse(await readFile(configPath, 'utf8'))
} catch (cause) {
  error(`Unable to read compliance/site.json: ${cause.message}`)
}

if (config) {
  if (config.version !== 1) error('compliance/site.json must use version 1.')
  if (JSON.stringify(config).includes('REPLACE_')) {
    error('compliance/site.json still contains starter-template REPLACE_* values.')
  }

  try {
    const review = await readFile(reviewPath, 'utf8')
    if (!review.includes('<!-- stir-compliance-discovery:v1 -->')) {
      error('compliance/REVIEW.md is outdated; run stir-compliance-init to install the current service-discovery checklist.')
    }
  } catch (cause) {
    error(`Unable to read compliance/REVIEW.md: ${cause.message}`)
  }

  for (const field of ['legalName', 'brandName', 'domain', 'email', 'address']) {
    if (!config.owner?.[field]?.trim()) error(`owner.${field} is required.`)
  }

  if (!validDate(config.review?.lastReviewed)) error('review.lastReviewed must use YYYY-MM-DD.')
  if (!validDate(config.review?.nextReview)) error('review.nextReview must use YYYY-MM-DD.')
  else {
    const days = daysFromToday(config.review.nextReview)
    if (days < 0) error(`Compliance review is overdue by ${Math.abs(days)} day(s).`)
    else if (days <= 30) warn(`Compliance review is due in ${days} day(s).`)
  }
  if (config.review?.intervalMonths !== 6) warn('The standard review interval is six months.')

  for (const key of ['privacy', 'terms', 'accessibility']) {
    const document = config.documents?.[key]
    if (!document?.title || !document?.path?.startsWith('/')) {
      error(`documents.${key} must have a title and root-relative path.`)
      continue
    }
    if (document.source !== 'drupal') error(`documents.${key}.source must be "drupal".`)
    if (document.menu !== 'footer') warn(`${document.title} is not declared in the footer menu.`)
    if (siteUrl) await checkPublicDocument(document)
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
}

console.log('Stir compliance audit')
for (const message of warnings) console.log(`WARN  ${message}`)
for (const message of errors) console.error(`ERROR ${message}`)

if (errors.length) process.exitCode = 1
else console.log(`PASS  ${warnings.length} warning(s), no blocking errors.`)
