import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function assertPresetOutput(consumerDir, preset) {
  const output = resolve(consumerDir, '.output')
  const files = await readdir(output, { recursive: true })
  const searchable = files.filter(file => /\.(?:css|js|mjs)$/.test(file))
  let editorial = false
  let consent = false
  for (const file of searchable) {
    const content = await readFile(resolve(output, file), 'utf8')
    editorial ||= content.includes('admin-ui-controls')
    consent ||= content.includes('cookie_consent')
  }
  const paragraphRoutes = files.filter(file => /server\/chunks\/routes\/api\/paragraph\/.+\/text\.(?:get|post)\.mjs$/.test(file))
  const webformRoutes = files.filter(file => /server\/chunks\/routes\/api\/webform\//.test(file))
  const authRoutes = files.filter(file => /server\/chunks\/routes\/api\/auth\//.test(file))
  if (preset === 'minimal') {
    if (editorial || consent || paragraphRoutes.length || webformRoutes.length || authRoutes.length) {
      throw new Error('Minimal output contains an excluded capability.')
    }
  } else if (!editorial || !consent || paragraphRoutes.length !== 2 || !webformRoutes.length || !authRoutes.length) {
    throw new Error(`${preset} output is missing a required capability.`)
  }
}
