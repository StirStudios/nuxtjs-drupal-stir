import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const host = '127.0.0.1'
const nuxtPort = process.env.A11Y_SERVER_PORT || '4173'
const authUiConfig = JSON.parse(await readFile(fileURLToPath(new URL(
  '../../contracts/stir-tools/v1/fixtures/auth-ui-config.json',
  import.meta.url,
)), 'utf8'))
const pageFixture = {
  title: 'Accessibility fixture',
  metatags: { meta: [], link: [], jsonld: null },
  content: {
    element: 'node--default',
    props: { title: 'Accessibility fixture' },
    slots: {
      hero: [{
        element: 'paragraph-hero',
        props: {},
        slots: {},
      }],
      body: [{
        element: 'drupal-markup',
        props: {
          content: '<p>Deterministic Drupal content for accessibility testing.</p>',
        },
        slots: {},
      }],
      contact: [{
        element: 'field-link',
        props: {
          url: '/contact',
          label: 'Contact this page',
          external: false,
        },
        slots: {},
      }],
    },
  },
}

const drupal = createServer((request, response) => {
  const path = new URL(request.url || '/', `http://${host}`).pathname
  const payload = path === '/api/app-context'
    ? {
        blocks: {},
        footer_menu: [],
        site_info: { name: 'Accessibility fixture', mail: '', slogan: '' },
      }
    : path === '/api/auth/config'
      ? authUiConfig
      : path === '/api/seo/global'
        ? { lang: 'en', meta: [], link: [] }
        : path.includes('/api/menu_items/')
          ? []
          : pageFixture

  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify(payload))
})

await new Promise((resolvePromise, reject) => {
  drupal.once('error', reject)
  drupal.listen(0, host, resolvePromise)
})

const address = drupal.address()

if (!address || typeof address === 'string') {
  throw new Error('Unable to start the accessibility Drupal fixture.')
}

const packageManager = process.env.npm_execpath
  ? { command: process.execPath, args: [process.env.npm_execpath, 'dev'] }
  : { command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args: ['dev'] }
const nuxt = spawn(
  packageManager.command,
  [...packageManager.args, '--host', host, '--port', nuxtPort],
  {
    env: {
      ...process.env,
      DRUPAL_URL: `http://${host}:${address.port}`,
      NUXT_INDEXABLE: 'false',
      NUXT_URL: `http://${host}:${nuxtPort}`,
    },
    stdio: 'inherit',
  },
)

const stop = async () => {
  nuxt.kill('SIGTERM')
  await new Promise(resolvePromise => drupal.close(resolvePromise))
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await stop()
    process.exit(0)
  })
}

const [code, signal] = await once(nuxt, 'exit')
await new Promise(resolvePromise => drupal.close(resolvePromise))

if (signal) process.kill(process.pid, signal)
else process.exitCode = code ?? 1
