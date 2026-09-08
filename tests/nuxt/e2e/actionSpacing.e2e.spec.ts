import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { expect, it } from 'vitest'

it('applies one configurable gap after text, with no gap for button-only content', async () => {
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage()

    await page.setContent(`
      <div class="region"><div><div class="prose">Copy</div></div><div id="single" class="paragraph-button">Action</div></div>
      <div class="region"><div class="prose">Copy</div><section id="group" class="action-group">Actions</section></div>
      <div class="region"><section id="alone" class="action-group">Actions</section></div>
      <div class="region"><div class="paragraph-button">First</div><div id="second" class="paragraph-button">Second</div></div>
      <div class="hero-content-flow"><div>Title</div><div id="hero" class="hero-actions">Action</div></div>
      <div class="hero-content-flow"><div id="hero-alone" class="hero-actions">Action</div></div>
    `)
    await page.addStyleTag({ content: readFileSync(resolve('layers/theme/app/assets/css/layout-presets.css'), 'utf8') })
    const margins = () => page.evaluate(() => ['single', 'group', 'alone', 'second'].map(id => getComputedStyle(document.getElementById(id)!).marginBlockStart))

    const heroGap = () => page.evaluate(() => {
      const action = document.getElementById('hero')!

      return action.getBoundingClientRect().top - action.previousElementSibling!.getBoundingClientRect().bottom
    })

    expect(await heroGap()).toBe(24)
    expect(await margins()).toEqual(['24px', '24px', '0px', '0px'])
    await page.addStyleTag({ content: ':root { --stir-content-action-gap: 40px; }' })
    expect(await heroGap()).toBe(40)
    expect(await margins()).toEqual(['40px', '40px', '0px', '0px'])
  }
  finally {
    await browser.close()
  }
})
