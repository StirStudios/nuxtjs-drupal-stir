import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import type { NuxtPage } from '@nuxt/test-utils/e2e'

// Cloudflare's always-pass test key: the real widget runs and issues a dummy
// token, so these tests need network access to challenges.cloudflare.com.
process.env.TURNSTILE_KEY = '1x00000000000000000000AA'
process.env.DRUPAL_URL = 'http://127.0.0.1:9'

const BLOCKED = /An ad or content blocker can stop it/

/** Records each sign-in request's token and answers it without Drupal. */
async function recordLogins(page: NuxtPage): Promise<string[]> {
  const tokens: string[] = []

  await page.route('**/api/auth/login', async (route) => {
    tokens.push(route.request().postDataJSON()?.turnstile_response ?? '')
    await route.fulfill({ status: 401, json: { error: 'The email or password is incorrect.' } })
  })

  return tokens
}

async function submitSignIn(page: NuxtPage): Promise<void> {
  await page.getByLabel(/email/i).first().fill('member@example.com')
  await page.locator('input[type="password"]').fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
}

describe('Forms and the Turnstile security check', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../fixtures/turnstile-consumer', import.meta.url)),
    browser: true,
    nuxtConfig: { sourcemap: { client: false, server: false } },
  })

  it('waits for a check that finishes after the visitor presses submit', async () => {
    const page = await createPage()
    const tokens = await recordLogins(page)

    // Cloudflare answers slowly, so the press comes before any token.
    await page.route('**/challenges.cloudflare.com/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2_000))
      await route.continue()
    })
    await page.goto(url('/auth/login'), { waitUntil: 'hydration' })
    await submitSignIn(page)

    await expect.poll(() => tokens, { timeout: 30_000 }).toHaveLength(1)
    expect(tokens[0]).not.toBe('')
  }, 60_000)

  it('explains a blocked check and sends nothing', async () => {
    const page = await createPage()
    const tokens = await recordLogins(page)

    // What a content blocker does to Cloudflare's script.
    await page.route('**/challenges.cloudflare.com/**', route => route.abort('blockedbyclient'))
    await page.goto(url('/auth/login'), { waitUntil: 'hydration' })
    await submitSignIn(page)

    await expect.poll(() => page.getByText(BLOCKED).count(), { timeout: 15_000 }).toBeGreaterThan(0)
    expect(tokens).toEqual([])
  }, 60_000)
})
