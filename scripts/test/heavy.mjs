#!/usr/bin/env node
// Runs a heavy suite or build (Nuxt runtime tests, E2E builds, consumer
// builds) only when no other one from this checkout is running and the
// machine isn't already overloaded. Each runtime spec boots a Nuxt app and
// each E2E spec runs a full build, so two at once, or one next to a dev
// server, typecheck or DDEV work, can exhaust memory and stall the machine.
//
// Skipped on CI or with STIR_HEAVY_OK=1. Nested runs (test:all calling
// test:nuxt) share the outer run's lock.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { availableParallelism, loadavg } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const command = process.argv.slice(2)
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const lockFile = resolve(rootDir, 'node_modules/.cache/stir-heavy.lock')
const skip = process.env.CI || process.env.STIR_HEAVY_OK === '1' || process.env.STIR_HEAVY_LOCK

if (command.length === 0) {
  console.error('Usage: node scripts/test/heavy.mjs <command> [...args]')
  process.exit(2)
}

function stop(reason) {
  console.error(`\n✋ Not starting \`${command.join(' ')}\`: ${reason}`)
  console.error('   Run heavy suites one at a time, never alongside typecheck, a dev server or DDEV work.')
  console.error('   For a quick check run `pnpm test` (unit only); CI runs `pnpm test:all`.')
  console.error('   To override, set STIR_HEAVY_OK=1.\n')
  process.exit(1)
}

function running(pid) {
  try {
    process.kill(pid, 0)
    return true
  }
  catch {
    return false
  }
}

if (!skip) {
  if (existsSync(lockFile)) {
    const [pid, holder] = readFileSync(lockFile, 'utf8').split('\n')

    if (running(Number(pid))) stop(`\`${holder}\` (pid ${pid}) is already running.`)
  }

  const cores = availableParallelism()
  const [load] = loadavg()

  if (load > cores * 1.5) {
    stop(`the load average is ${load.toFixed(0)} on ${cores} cores. Wait for it to settle.`)
  }

  mkdirSync(dirname(lockFile), { recursive: true })
  writeFileSync(lockFile, `${process.pid}\n${command.join(' ')}\n`)
}

const child = spawn(command[0], command.slice(1), {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, STIR_HEAVY_LOCK: '1' },
})
const release = () => {
  if (!skip) rmSync(lockFile, { force: true })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}

child.on('exit', (code, signal) => {
  release()
  process.exit(code ?? (signal ? 1 : 0))
})
