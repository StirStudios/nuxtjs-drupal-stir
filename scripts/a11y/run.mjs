#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const playwrightCli = fileURLToPath(import.meta.resolve('@playwright/test/cli'))
const configTemplatePath = fileURLToPath(
  new URL('./playwright.config.mjs', import.meta.url),
)
const specTemplatePath = fileURLToPath(
  new URL('./accessibility.spec.mjs', import.meta.url),
)
const requestedArgs = process.argv.slice(2)
const passthroughCommands = new Set(['install', 'show-report'])
const isPassthrough = passthroughCommands.has(requestedArgs[0] ?? '')
let temporaryAuditDirectory
let playwrightArgs = requestedArgs

if (!isPassthrough) {
  temporaryAuditDirectory = await mkdtemp(
    path.join(tmpdir(), 'stir-a11y-'),
  )

  const configPath = path.join(
    temporaryAuditDirectory,
    'playwright.config.mjs',
  )
  const specPath = path.join(temporaryAuditDirectory, 'accessibility.spec.mjs')
  const playwrightModule = import.meta.resolve('@playwright/test')
  const axeModule = import.meta.resolve('@axe-core/playwright')
  const [configTemplate, specTemplate] = await Promise.all([
    readFile(configTemplatePath, 'utf8'),
    readFile(specTemplatePath, 'utf8'),
  ])

  await Promise.all([
    writeFile(
      configPath,
      configTemplate.replaceAll('@playwright/test', playwrightModule),
    ),
    writeFile(
      specPath,
      specTemplate
        .replaceAll('@playwright/test', playwrightModule)
        .replaceAll('@axe-core/playwright', axeModule),
    ),
  ])

  playwrightArgs = ['test', specPath, '--config', configPath, ...requestedArgs]
}

const cleanUp = async () => {
  if (temporaryAuditDirectory) {
    await rm(temporaryAuditDirectory, { force: true, recursive: true })
  }
}

const child = spawn(process.execPath, [playwrightCli, ...playwrightArgs], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
})

child.once('error', async (error) => {
  await cleanUp()
  console.error(`Unable to start the accessibility audit: ${error.message}`)
  process.exitCode = 1
})

child.once('exit', async (code, signal) => {
  await cleanUp()

  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exitCode = code ?? 1
})
