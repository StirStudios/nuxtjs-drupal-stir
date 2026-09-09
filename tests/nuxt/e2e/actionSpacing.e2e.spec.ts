import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { expect, it } from 'vitest'
import { compile } from 'tailwindcss'

it('applies one configurable gap after text, with no gap for button-only content', async () => {
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage()

    const source = readFileSync(resolve('layers/theme/app/components/global/Paragraph/Layout.vue'), 'utf8')
    const utility = source.match(/\[&>:where\([^']+?:mt-\[[^']+?\]/)?.[0]

    expect(utility).toBeTruthy()
    const compiler = await compile('@tailwind utilities;')

    await page.setContent(`
      <div class="region ${utility}"><div><div class="prose">Copy</div></div><div id="single" class="paragraph-button">Action</div></div>
      <div class="region ${utility}"><div class="prose">Copy</div><section id="group" class="action-group">Actions</section></div>
      <div class="region ${utility}"><section id="alone" class="action-group">Actions</section></div>
      <div class="region ${utility}"><div class="paragraph-button">First</div><div id="second" class="paragraph-button">Second</div></div>
    `)
    await page.addStyleTag({ content: compiler.build([utility!]) })
    const margins = () => page.evaluate(() => ['single', 'group', 'alone', 'second'].map(id => getComputedStyle(document.getElementById(id)!).marginBlockStart))

    expect(await margins()).toEqual(['24px', '24px', '0px', '0px'])
    await page.addStyleTag({ content: ':root { --stir-content-action-gap: 40px; }' })
    expect(await margins()).toEqual(['40px', '40px', '0px', '0px'])
  }
  finally {
    await browser.close()
  }
})
