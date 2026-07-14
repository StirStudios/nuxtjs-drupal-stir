import { spawn } from 'node:child_process'
import { once } from 'node:events'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const prefix = `--${name}=`
  const value = args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)

  return value || fallback
}
const numberOption = (name, fallback) => Number(option(name, String(fallback)))
const host = '127.0.0.1'
const port = numberOption('port', 3012)
const routePath = option('path', '/')
const origin = `http://${host}:${port}`
const targetUrl = new URL(routePath, `${origin}/`).toString()
const forwardedArgs = args.filter(
  (arg) =>
    arg !== '--' &&
    !arg.startsWith('--path=') &&
    !arg.startsWith('--port='),
)
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

function packageManagerCommand(script) {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, script],
    }
  }

  return {
    command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: [script],
  }
}

async function run(command, commandArgs, options = {}) {
  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    ...options,
  })
  const [code, signal] = await once(child, 'exit')

  if (code !== 0) {
    throw new Error(
      `${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}`,
    )
  }
}

async function assertPortAvailable() {
  try {
    await fetch(origin, { signal: AbortSignal.timeout(1000) })
  } catch {
    return
  }

  throw new Error(`Port ${port} is already serving a response; stop it first.`)
}

function captureOutput(child) {
  let output = ''
  const append = (chunk) => {
    output = `${output}${chunk}`.slice(-10_000)
  }

  child.stdout?.on('data', append)
  child.stderr?.on('data', append)
  return () => output
}

async function waitForPage(server, serverOutput) {
  const deadline = Date.now() + 60_000

  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Production server exited before it was ready.\n${serverOutput()}`)
    }

    try {
      const response = await fetch(targetUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.text()
    } catch {
      await delay(250)
    }
  }

  throw new Error(`Timed out waiting for ${targetUrl}.\n${serverOutput()}`)
}

async function assertCompressedAssets(html) {
  const assetPath = html.match(
    /(?:src|href)="([^"]*\/_nuxt\/[^"]+\.(?:css|js))"/,
  )?.[1]

  if (!assetPath) {
    throw new Error('No Nuxt CSS or JavaScript asset was found in the page HTML.')
  }

  const response = await fetch(new URL(assetPath, origin), {
    headers: { 'accept-encoding': 'br, gzip' },
  })
  const encoding = response.headers.get('content-encoding')

  if (encoding !== 'br' && encoding !== 'gzip') {
    throw new Error(`Production assets are not compressed (${assetPath}).`)
  }

  console.log(`Ready: ${targetUrl} (${encoding} assets)`)
}

async function stopServer(server) {
  const usesProcessGroup = process.platform !== 'win32' && server.pid
  const signal = (name) => {
    try {
      if (usesProcessGroup) {
        process.kill(-server.pid, name)
      } else {
        server.kill(name)
      }
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error
    }
  }

  signal('SIGTERM')

  if (server.exitCode === null && server.signalCode === null) {
    await Promise.race([once(server, 'exit'), delay(5000)])
  }

  if (server.exitCode === null && server.signalCode === null) {
    signal('SIGKILL')
    await once(server, 'exit')
  }
}

async function main() {
  await assertPortAvailable()

  const build = packageManagerCommand('build')
  await run(build.command, build.args)

  const preview = packageManagerCommand('preview')
  const server = spawn(preview.command, preview.args, {
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      HOST: host,
      NODE_ENV: 'production',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const serverOutput = captureOutput(server)

  const stopOnSignal = async () => {
    await stopServer(server)
    process.exit(130)
  }
  process.once('SIGINT', stopOnSignal)
  process.once('SIGTERM', stopOnSignal)

  try {
    const html = await waitForPage(server, serverOutput)
    await assertCompressedAssets(html)
    await run(
      process.execPath,
      [
        'scripts/perf/lighthouse.mjs',
        `--url=${targetUrl}`,
        ...forwardedArgs,
      ],
      { env: process.env },
    )
  } finally {
    process.removeListener('SIGINT', stopOnSignal)
    process.removeListener('SIGTERM', stopOnSignal)
    await stopServer(server)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
