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
const paragraphText = (uuid, text) => ({
  element: 'paragraph-text',
  props: { uuid, text },
  slots: {},
})

// Interactive custom elements carry most of the keyboard, focus and accessible
// naming risk, so the audited page renders them rather than markup alone.
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
      body: [
        {
          element: 'drupal-markup',
          props: {
            content: '<p>Deterministic Drupal content for accessibility testing.</p>',
          },
          slots: {},
        },
        {
          element: 'paragraph-accordion',
          props: {
            uuid: '00000000-0000-4000-8000-0000000000a1',
            header: 'Accordion section',
            headerTag: 'h2',
          },
          slots: {
            items: [
              {
                element: 'paragraph-accordion-item',
                props: {
                  uuid: '00000000-0000-4000-8000-0000000000a2',
                  header: 'First question',
                  text: '<p>First answer.</p>',
                },
                slots: {},
              },
              {
                // A blank authored header must still expose an accessible name.
                element: 'paragraph-accordion-item',
                props: {
                  uuid: '00000000-0000-4000-8000-0000000000a3',
                  header: '   ',
                  text: '<p>Second answer.</p>',
                },
                slots: {},
              },
            ],
          },
        },
        {
          element: 'paragraph-tabs',
          props: { uuid: '00000000-0000-4000-8000-0000000000b1' },
          slots: {
            tab: [
              {
                element: 'paragraph-tab',
                props: {
                  uuid: '00000000-0000-4000-8000-0000000000b2',
                  title: 'First tab',
                },
                slots: {
                  tabContent: [
                    paragraphText(
                      '00000000-0000-4000-8000-0000000000b3',
                      '<p>First tab content.</p>',
                    ),
                  ],
                },
              },
              {
                element: 'paragraph-tab',
                props: {
                  uuid: '00000000-0000-4000-8000-0000000000b4',
                  title: 'Second tab',
                },
                slots: {
                  tabContent: [
                    paragraphText(
                      '00000000-0000-4000-8000-0000000000b5',
                      '<p>Second tab content.</p>',
                    ),
                  ],
                },
              },
            ],
          },
        },
        {
          element: 'paragraph-layout',
          props: {
            uuid: '00000000-0000-4000-8000-0000000000c1',
            layout: 'two_column',
            container: true,
            header: 'Layout section',
            headerTag: 'h2',
            gridClass: 'lg:grid-cols-2 lg:gap-6',
          },
          slots: {
            first: [
              paragraphText(
                '00000000-0000-4000-8000-0000000000c2',
                '<p>Left region content.</p>',
              ),
            ],
            second: [
              paragraphText(
                '00000000-0000-4000-8000-0000000000c3',
                '<p>Right region content.</p>',
              ),
            ],
          },
        },
      ],
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
  ? { command: process.execPath, args: [process.env.npm_execpath] }
  : { command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args: [] }
const nuxtEnvironment = {
  ...process.env,
  DRUPAL_URL: `http://${host}:${address.port}`,
  NUXT_INDEXABLE: 'false',
  NUXT_URL: `http://${host}:${nuxtPort}`,
}
const build = spawn(
  packageManager.command,
  [...packageManager.args, 'build'],
  {
    env: nuxtEnvironment,
    stdio: 'inherit',
  },
)

const [buildCode, buildSignal] = await once(build, 'exit')

if (buildSignal || buildCode !== 0) {
  await new Promise(resolvePromise => drupal.close(resolvePromise))
  if (buildSignal) process.kill(process.pid, buildSignal)
  else process.exit(buildCode ?? 1)
}

const nuxt = spawn(
  process.execPath,
  ['.output/server/index.mjs'],
  {
    env: {
      ...nuxtEnvironment,
      NITRO_HOST: host,
      NITRO_PORT: nuxtPort,
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
