import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { request } from 'node:http'
import { createSecureServer } from 'node:http2'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGzip } from 'node:zlib'

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
const frontPort = numberOption('front-port', port + 1)
const targetUrl = new URL(routePath, `${origin}/`).toString()
const frontUrl = new URL(routePath, `https://${host}:${frontPort}/`).toString()
const forwardedArgs = args.filter(
  (arg) =>
    arg !== '--' &&
    !arg.startsWith('--path=') &&
    !arg.startsWith('--port=') &&
    !arg.startsWith('--front-port='),
)
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

function packageManagerCommand(script) {
  const execPath = process.env.npm_execpath

  // pnpm 12 runs as a native binary; older pnpm is a script for Node.
  if (execPath) {
    return /\.[cm]?js$/.test(execPath)
      ? { command: process.execPath, args: [execPath, script] }
      : { command: execPath, args: [script] }
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

// Production sits behind a server that speaks HTTP/2 and compresses HTML; the
// Node preview server does neither. Lighthouse's simulated throttling models
// HTTP/1.1 as six connections per host, which turns the ~150 module requests
// of a hydrated page into a queue and inflates LCP far beyond what production
// shows. Front the preview with HTTP/2 and gzip so local runs measure the page
// as it is served.
function startProductionFront() {
  const certDirectory = mkdtempSync(join(tmpdir(), 'stir-lighthouse-'))
  const keyPath = join(certDirectory, 'key.pem')
  const certPath = join(certDirectory, 'cert.pem')

  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', `/CN=${host}`, '-keyout', keyPath, '-out', certPath,
  ], { stdio: 'ignore' })

  const front = createSecureServer({
    allowHTTP1: true,
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  }, (clientRequest, clientResponse) => {
    const headers = Object.fromEntries(
      Object.entries(clientRequest.headers).filter(([name]) => !name.startsWith(':')),
    )
    const authority = clientRequest.headers[':authority'] || clientRequest.headers.host

    const upstream = request({
      headers: { ...headers, 'host': authority, 'x-forwarded-host': authority, 'x-forwarded-proto': 'https' },
      host,
      method: clientRequest.method,
      path: clientRequest.url,
      port,
    }, (upstreamResponse) => {
      const responseHeaders = { ...upstreamResponse.headers }

      for (const name of ['connection', 'keep-alive', 'transfer-encoding']) delete responseHeaders[name]

      const compressHtml = !responseHeaders['content-encoding']
        && String(responseHeaders['content-type'] || '').includes('text/html')
        && /\bgzip\b/.test(String(clientRequest.headers['accept-encoding'] || ''))

      if (compressHtml) {
        delete responseHeaders['content-length']
        responseHeaders['content-encoding'] = 'gzip'
      }

      clientResponse.writeHead(upstreamResponse.statusCode || 502, responseHeaders)
      ;(compressHtml ? upstreamResponse.pipe(createGzip()) : upstreamResponse).pipe(clientResponse)
    })

    upstream.on('error', () => clientResponse.destroy())
    clientRequest.pipe(upstream)
  })

  front.listen(frontPort, host)
  rmSync(certDirectory, { force: true, recursive: true })
  console.log(`Measuring ${frontUrl} (HTTP/2, gzip HTML) in front of ${targetUrl}`)

  return front
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

  let front

  try {
    const html = await waitForPage(server, serverOutput)
    await assertCompressedAssets(html)
    front = startProductionFront()
    await once(front, 'listening')
    await run(
      process.execPath,
      [
        fileURLToPath(new URL('./lighthouse.mjs', import.meta.url)),
        `--url=${frontUrl}`,
        ...forwardedArgs,
      ],
      { env: process.env },
    )
  } finally {
    process.removeListener('SIGINT', stopOnSignal)
    process.removeListener('SIGTERM', stopOnSignal)
    front?.close()
    await stopServer(server)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
